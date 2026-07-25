import path from "node:path";
import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import pinoHttp from "pino-http";
import swaggerUi from "swagger-ui-express";
import fs from "node:fs";
import { load as loadYaml } from "js-yaml";

import { env } from "./config/env";
import { logger } from "./config/logger";
import { prisma } from "./infrastructure/prisma/client";

// Repositories
import { PrismaPlayerRepository } from "./infrastructure/prisma/PrismaPlayerRepository";
import { PrismaOtpRepository } from "./infrastructure/prisma/PrismaOtpRepository";
import { PrismaAdminUserRepository } from "./infrastructure/prisma/PrismaAdminUserRepository";
import { PrismaRefreshTokenRepository } from "./infrastructure/prisma/PrismaRefreshTokenRepository";
import { PrismaTournamentRepository } from "./infrastructure/prisma/PrismaTournamentRepository";
import { PrismaRegistrationRepository } from "./infrastructure/prisma/PrismaRegistrationRepository";
import { PrismaPaymentRepository } from "./infrastructure/prisma/PrismaPaymentRepository";
import { PrismaCheckinRepository } from "./infrastructure/prisma/PrismaCheckinRepository";
import { PrismaMessageRepository } from "./infrastructure/prisma/PrismaMessageRepository";
import { PrismaStatRepository } from "./infrastructure/prisma/PrismaStatRepository";
import { PrismaDuplicateFlagRepository } from "./infrastructure/prisma/PrismaDuplicateFlagRepository";
import { PrismaAuditLogRepository } from "./infrastructure/prisma/PrismaAuditLogRepository";

// Providers
import { createSmsProvider } from "./infrastructure/providers/SmsProvider";
import { createWhatsAppProvider } from "./infrastructure/providers/WhatsAppProvider";
import { createPaymentProvider } from "./infrastructure/providers/PaymentProvider";
import { createStorageProvider } from "./infrastructure/storage/factory";

// Use cases
import { makeRequestOtpUseCase } from "./application/auth/RequestOtpUseCase";
import { makeVerifyOtpUseCase } from "./application/auth/VerifyOtpUseCase";
import { makeRefreshSessionUseCase } from "./application/auth/RefreshSessionUseCase";
import { makeAdminLoginUseCase } from "./application/auth/AdminLoginUseCase";
import { makeIssueSessionForPlayerUseCase } from "./application/auth/IssueSessionForPlayerUseCase";
import { makeLogoutUseCase } from "./application/auth/LogoutUseCase";

import { makeRegisterPlayerUseCase } from "./application/players/RegisterPlayerUseCase";
import { makeGetMyProfileUseCase } from "./application/players/GetMyProfileUseCase";
import { makeUpdateProfileUseCase } from "./application/players/UpdateProfileUseCase";
import { makeUploadPhotoUseCase } from "./application/players/UploadPhotoUseCase";

import { makeSearchPlayersUseCase } from "./application/admin/SearchPlayersUseCase";
import { makeGetPlayerDetailUseCase } from "./application/admin/GetPlayerDetailUseCase";
import { makeApprovePlayerUseCase } from "./application/admin/ApprovePlayerUseCase";
import { makeRejectPlayerUseCase } from "./application/admin/RejectPlayerUseCase";
import { makeRequestChangesUseCase } from "./application/admin/RequestChangesUseCase";
import { makeAssignCricketProfileUseCase } from "./application/admin/AssignCricketProfileUseCase";
import { makeDetectDuplicatesUseCase } from "./application/admin/DetectDuplicatesUseCase";
import { makeListDuplicateFlagsUseCase } from "./application/admin/ListDuplicateFlagsUseCase";
import { makeResolveDuplicateFlagUseCase } from "./application/admin/ResolveDuplicateFlagUseCase";
import { makeDeletePlayerUseCase } from "./application/admin/DeletePlayerUseCase";

import { makeCreateTournamentUseCase } from "./application/tournaments/CreateTournamentUseCase";
import { makeListTournamentsUseCase } from "./application/tournaments/ListTournamentsUseCase";
import { makeGetTournamentUseCase } from "./application/tournaments/GetTournamentUseCase";
import { makeUpdateTournamentUseCase } from "./application/tournaments/UpdateTournamentUseCase";
import { makePublishTournamentUseCase } from "./application/tournaments/PublishTournamentUseCase";
import { makeGetRosterUseCase } from "./application/tournaments/GetRosterUseCase";
import { makeDeleteTournamentUseCase } from "./application/tournaments/DeleteTournamentUseCase";

import { makeRegisterForTournamentUseCase } from "./application/registrations/RegisterForTournamentUseCase";
import { makeCreatePaymentOrderUseCase } from "./application/registrations/CreatePaymentOrderUseCase";
import { makeCancelRegistrationUseCase } from "./application/registrations/CancelRegistrationUseCase";
import { makeListMyRegistrationsUseCase } from "./application/registrations/ListMyRegistrationsUseCase";
import { makeRemoveRegistrationUseCase } from "./application/registrations/RemoveRegistrationUseCase";
import { makeConfirmPaymentFromWebhookUseCase } from "./application/registrations/ConfirmPaymentFromWebhookUseCase";

import { makeCreateCampaignUseCase } from "./application/communications/CreateCampaignUseCase";
import { makeListCampaignsUseCase } from "./application/communications/ListCampaignsUseCase";

import { makeScanCheckinUseCase } from "./application/checkin/ScanCheckinUseCase";
import { makeGetAttendanceRosterUseCase } from "./application/checkin/GetAttendanceRosterUseCase";

import { makeGetPlayerStatsUseCase } from "./application/stats/GetPlayerStatsUseCase";

// Routes
import { authRoutes } from "./interfaces/http/routes/auth.routes";
import { playersRoutes } from "./interfaces/http/routes/players.routes";
import { adminRoutes } from "./interfaces/http/routes/admin.routes";
import { tournamentsRoutes } from "./interfaces/http/routes/tournaments.routes";
import { registrationsRoutes } from "./interfaces/http/routes/registrations.routes";
import { paymentsRoutes } from "./interfaces/http/routes/payments.routes";
import { communicationsRoutes } from "./interfaces/http/routes/communications.routes";
import { checkinRoutes } from "./interfaces/http/routes/checkin.routes";
import { statsRoutes } from "./interfaces/http/routes/stats.routes";
import { healthRoutes } from "./interfaces/http/routes/health.routes";

import { requestId } from "./interfaces/http/middleware/requestId";
import { globalRateLimiter } from "./interfaces/http/middleware/rateLimiter";
import { errorHandler, notFoundHandler } from "./interfaces/http/middleware/errorHandler";

/** Parses the comma-separated ALLOWED_ORIGINS env var into the array form cors() expects. */
function parseAllowedOrigins(value: string | undefined): string[] {
  const origins = (value ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  if (origins.length === 0) {
    throw new Error(
      "ALLOWED_ORIGINS must be set to a comma-separated list of allowed origins in production (e.g. https://app.example.com).",
    );
  }
  return origins;
}

/**
 * Composition root: this is the only file allowed to know that Prisma,
 * Express, and specific provider implementations exist all at once. Every
 * use case above is constructed here from domain-level repository/port
 * interfaces — swap any Prisma* repo or provider for a fake and nothing
 * above this file needs to change.
 */
export function createApp(): Express {
  const app = express();

  // ---- global middleware ----
  app.use(requestId);
  app.use(
    pinoHttp({
      logger,
      // Without this, pino-http mints its own request id independent of the
      // x-request-id header requestId() just set/propagated above, so the id
      // in structured logs would never match what's returned to the client —
      // defeating the point of having a correlation id at all.
      genReqId: (req) => req.headers["x-request-id"] as string,
      customLogLevel: (_req, res) => (res.statusCode >= 500 ? "error" : "info"),
    }),
  );
  app.use(helmet());
  app.use(
    cors({
      // In production this must be an explicit allowlist, not `true`
      // (reflects every origin) and not `undefined` — passing `undefined`
      // overwrites the cors package's own default and results in NO
      // Access-Control-Allow-Origin header being sent at all, silently
      // blocking the production frontend on every cross-origin request.
      origin: env.NODE_ENV === "production" ? parseAllowedOrigins(env.ALLOWED_ORIGINS) : true,
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(
    express.json({
      limit: "1mb",
      // Stashes the exact bytes received so the payments webhook can verify
      // its HMAC signature over the raw body — re-serializing req.body would
      // produce different bytes than what Razorpay actually signed. See
      // controllers/payments.controller.ts.
      verify: (req, _res, buf) => {
        (req as express.Request).rawBody = buf;
      },
    }),
  );
  app.use(globalRateLimiter);
  // helmet()'s default Cross-Origin-Resource-Policy: same-origin blocks the
  // web app (a different origin/port in dev, and typically a separate
  // subdomain in prod) from ever rendering an <img> pointed at these files —
  // that's the exact "photo doesn't show up after registration" symptom.
  // Uploaded photos are public-read profile pictures, not sensitive, so
  // cross-origin embedding is safe to allow for this path only.
  app.use("/uploads", (_req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  });
  app.use("/uploads", express.static(path.resolve(env.UPLOAD_DIR)));

  // ---- repositories (infrastructure) ----
  const playerRepo = new PrismaPlayerRepository(prisma);
  const otpRepo = new PrismaOtpRepository(prisma);
  const adminUserRepo = new PrismaAdminUserRepository(prisma);
  const refreshTokenRepo = new PrismaRefreshTokenRepository(prisma);
  const tournamentRepo = new PrismaTournamentRepository(prisma);
  const registrationRepo = new PrismaRegistrationRepository(prisma);
  const paymentRepo = new PrismaPaymentRepository(prisma);
  const checkinRepo = new PrismaCheckinRepository(prisma);
  const messageRepo = new PrismaMessageRepository(prisma);
  const statRepo = new PrismaStatRepository(prisma);
  const duplicateFlagRepo = new PrismaDuplicateFlagRepository(prisma);
  const auditLogRepo = new PrismaAuditLogRepository(prisma);

  // ---- providers (infrastructure) ----
  const smsProvider = createSmsProvider();
  const whatsAppProvider = createWhatsAppProvider();
  const paymentProvider = createPaymentProvider();
  const storageProvider = createStorageProvider();

  // ---- use cases (application) ----
  const authUseCases = {
    requestOtp: makeRequestOtpUseCase({ otpRepo, smsProvider }),
    verifyOtp: makeVerifyOtpUseCase({ otpRepo, playerRepo, refreshTokenRepo }),
    refreshSession: makeRefreshSessionUseCase({ refreshTokenRepo }),
    adminLogin: makeAdminLoginUseCase({ adminUserRepo, refreshTokenRepo }),
    logout: makeLogoutUseCase({ refreshTokenRepo }),
  };

  const playersUseCases = {
    registerPlayer: makeRegisterPlayerUseCase({ playerRepo }),
    getMyProfile: makeGetMyProfileUseCase({ playerRepo }),
    updateProfile: makeUpdateProfileUseCase({ playerRepo }),
    uploadPhoto: makeUploadPhotoUseCase({ playerRepo, storageProvider }),
    detectDuplicates: makeDetectDuplicatesUseCase({ playerRepo, duplicateFlagRepo }),
    issueSessionForPlayer: makeIssueSessionForPlayerUseCase({ refreshTokenRepo }),
  };

  const adminUseCases = {
    searchPlayers: makeSearchPlayersUseCase({ playerRepo }),
    getPlayerDetail: makeGetPlayerDetailUseCase({ playerRepo }),
    approvePlayer: makeApprovePlayerUseCase({ playerRepo, auditLogRepo, whatsAppProvider }),
    rejectPlayer: makeRejectPlayerUseCase({ playerRepo, auditLogRepo }),
    requestChanges: makeRequestChangesUseCase({ playerRepo, auditLogRepo }),
    assignCricketProfile: makeAssignCricketProfileUseCase({ playerRepo, auditLogRepo }),
    listDuplicateFlags: makeListDuplicateFlagsUseCase({ duplicateFlagRepo }),
    resolveDuplicateFlag: makeResolveDuplicateFlagUseCase({ duplicateFlagRepo, auditLogRepo }),
    deletePlayer: makeDeletePlayerUseCase({ playerRepo, refreshTokenRepo, auditLogRepo }),
  };

  const tournamentsUseCases = {
    createTournament: makeCreateTournamentUseCase({ tournamentRepo }),
    listTournaments: makeListTournamentsUseCase({ tournamentRepo }),
    getTournament: makeGetTournamentUseCase({ tournamentRepo }),
    updateTournament: makeUpdateTournamentUseCase({ tournamentRepo }),
    publishTournament: makePublishTournamentUseCase({ tournamentRepo }),
    getRoster: makeGetRosterUseCase({ registrationRepo }),
    deleteTournament: makeDeleteTournamentUseCase({ tournamentRepo, auditLogRepo }),
    removeRegistration: makeRemoveRegistrationUseCase({ registrationRepo, auditLogRepo }),
  };

  const registrationsUseCases = {
    registerForTournament: makeRegisterForTournamentUseCase({
      playerRepo,
      tournamentRepo,
      registrationRepo,
      whatsAppProvider,
    }),
    createPaymentOrder: makeCreatePaymentOrderUseCase({ registrationRepo, paymentRepo, paymentProvider }),
    cancelRegistration: makeCancelRegistrationUseCase({ registrationRepo }),
    listMyRegistrations: makeListMyRegistrationsUseCase({ registrationRepo }),
  };

  const paymentsUseCases = {
    confirmPaymentFromWebhook: makeConfirmPaymentFromWebhookUseCase({ paymentRepo, registrationRepo }),
  };

  const communicationsUseCases = {
    createCampaign: makeCreateCampaignUseCase({
      playerRepo,
      messageRepo,
      registrationRepo,
      smsProvider,
      whatsAppProvider,
    }),
    listCampaigns: makeListCampaignsUseCase({ messageRepo }),
  };

  const checkinUseCases = {
    scanCheckin: makeScanCheckinUseCase({ registrationRepo, checkinRepo, auditLogRepo }),
    getAttendanceRoster: makeGetAttendanceRosterUseCase({ registrationRepo, checkinRepo }),
  };

  const statsUseCases = {
    getPlayerStats: makeGetPlayerStatsUseCase({ statRepo }),
  };

  // ---- routes (interfaces) ----
  app.use("/", healthRoutes(prisma));

  const v1 = express.Router();
  v1.use("/auth", authRoutes(authUseCases));
  v1.use("/players", playersRoutes(playersUseCases, playerRepo));
  v1.use("/admin", adminRoutes(adminUseCases));
  v1.use("/tournaments", tournamentsRoutes(tournamentsUseCases));
  v1.use("/registrations", registrationsRoutes(registrationsUseCases, playerRepo));
  v1.use("/payments", paymentsRoutes(paymentsUseCases, paymentProvider));
  v1.use("/communications", communicationsRoutes(communicationsUseCases));
  v1.use("/checkin", checkinRoutes(checkinUseCases));
  v1.use("/stats", statsRoutes(statsUseCases));
  app.use("/api/v1", v1);

  // ---- API docs ----
  const openapiDocument = loadYaml(fs.readFileSync(path.resolve(__dirname, "../openapi.yaml"), "utf8")) as Record<
    string,
    unknown
  >;
  app.get("/openapi.json", (_req, res) => res.json(openapiDocument));
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiDocument));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
