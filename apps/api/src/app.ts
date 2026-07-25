import path from "node:path";
import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import pinoHttp from "pino-http";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";

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

import { makeCreateTournamentUseCase } from "./application/tournaments/CreateTournamentUseCase";
import { makeListTournamentsUseCase } from "./application/tournaments/ListTournamentsUseCase";
import { makeGetTournamentUseCase } from "./application/tournaments/GetTournamentUseCase";
import { makeUpdateTournamentUseCase } from "./application/tournaments/UpdateTournamentUseCase";
import { makePublishTournamentUseCase } from "./application/tournaments/PublishTournamentUseCase";
import { makeGetRosterUseCase } from "./application/tournaments/GetRosterUseCase";

import { makeRegisterForTournamentUseCase } from "./application/registrations/RegisterForTournamentUseCase";
import { makeCreatePaymentOrderUseCase } from "./application/registrations/CreatePaymentOrderUseCase";
import { makeCancelRegistrationUseCase } from "./application/registrations/CancelRegistrationUseCase";
import { makeListMyRegistrationsUseCase } from "./application/registrations/ListMyRegistrationsUseCase";

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
import { communicationsRoutes } from "./interfaces/http/routes/communications.routes";
import { checkinRoutes } from "./interfaces/http/routes/checkin.routes";
import { statsRoutes } from "./interfaces/http/routes/stats.routes";
import { healthRoutes } from "./interfaces/http/routes/health.routes";

import { requestId } from "./interfaces/http/middleware/requestId";
import { globalRateLimiter } from "./interfaces/http/middleware/rateLimiter";
import { errorHandler, notFoundHandler } from "./interfaces/http/middleware/errorHandler";

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
  app.use(pinoHttp({ logger, customLogLevel: (_req, res) => (res.statusCode >= 500 ? "error" : "info") }));
  app.use(helmet());
  app.use(cors({ origin: env.NODE_ENV === "production" ? undefined : true, credentials: true }));
  app.use(compression());
  app.use(express.json({ limit: "1mb" }));
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
  };

  const tournamentsUseCases = {
    createTournament: makeCreateTournamentUseCase({ tournamentRepo }),
    listTournaments: makeListTournamentsUseCase({ tournamentRepo }),
    getTournament: makeGetTournamentUseCase({ tournamentRepo }),
    updateTournament: makeUpdateTournamentUseCase({ tournamentRepo }),
    publishTournament: makePublishTournamentUseCase({ tournamentRepo }),
    getRoster: makeGetRosterUseCase({ registrationRepo }),
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
  v1.use("/players", playersRoutes(playersUseCases));
  v1.use("/admin", adminRoutes(adminUseCases));
  v1.use("/tournaments", tournamentsRoutes(tournamentsUseCases));
  v1.use("/registrations", registrationsRoutes(registrationsUseCases));
  v1.use("/communications", communicationsRoutes(communicationsUseCases));
  v1.use("/checkin", checkinRoutes(checkinUseCases));
  v1.use("/stats", statsRoutes(statsUseCases));
  app.use("/api/v1", v1);

  // ---- API docs ----
  const openapiDocument = YAML.load(path.resolve(__dirname, "../openapi.yaml"));
  app.get("/openapi.json", (_req, res) => res.json(openapiDocument));
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiDocument));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
