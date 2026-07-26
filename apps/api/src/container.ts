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
import type { PaymentProvider } from "./domain/ports/providers";
import type { PlayerRepository } from "./domain/repositories/PlayerRepository";

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

/**
 * Composition root: the one place allowed to know that Prisma and specific
 * provider implementations exist at all. Every use case is constructed here
 * from domain-level repository/port interfaces — swap any Prisma* repo or
 * provider for a fake and nothing above this file needs to change.
 *
 * Repos that are needed directly by route modules (not just by use cases —
 * e.g. `makeRequireActivePlayer` reads the player fresh on every request)
 * are also exposed at the top level alongside the grouped use cases.
 */
export function buildContainer() {
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
  const paymentProvider: PaymentProvider = createPaymentProvider();
  const storageProvider = createStorageProvider();

  // ---- use cases (application) ----
  const auth = {
    requestOtp: makeRequestOtpUseCase({ otpRepo, smsProvider }),
    verifyOtp: makeVerifyOtpUseCase({ otpRepo, playerRepo, refreshTokenRepo }),
    refreshSession: makeRefreshSessionUseCase({ refreshTokenRepo }),
    adminLogin: makeAdminLoginUseCase({ adminUserRepo, refreshTokenRepo }),
    logout: makeLogoutUseCase({ refreshTokenRepo }),
  };

  const players = {
    registerPlayer: makeRegisterPlayerUseCase({ playerRepo }),
    getMyProfile: makeGetMyProfileUseCase({ playerRepo }),
    updateProfile: makeUpdateProfileUseCase({ playerRepo }),
    uploadPhoto: makeUploadPhotoUseCase({ playerRepo, storageProvider }),
    detectDuplicates: makeDetectDuplicatesUseCase({ playerRepo, duplicateFlagRepo }),
    issueSessionForPlayer: makeIssueSessionForPlayerUseCase({ refreshTokenRepo }),
  };

  const admin = {
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

  const tournaments = {
    createTournament: makeCreateTournamentUseCase({ tournamentRepo }),
    listTournaments: makeListTournamentsUseCase({ tournamentRepo }),
    getTournament: makeGetTournamentUseCase({ tournamentRepo }),
    updateTournament: makeUpdateTournamentUseCase({ tournamentRepo }),
    publishTournament: makePublishTournamentUseCase({ tournamentRepo }),
    getRoster: makeGetRosterUseCase({ registrationRepo }),
    deleteTournament: makeDeleteTournamentUseCase({ tournamentRepo, auditLogRepo }),
    removeRegistration: makeRemoveRegistrationUseCase({ registrationRepo, auditLogRepo }),
  };

  const registrations = {
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

  const payments = {
    confirmPaymentFromWebhook: makeConfirmPaymentFromWebhookUseCase({ paymentRepo, registrationRepo }),
  };

  const communications = {
    createCampaign: makeCreateCampaignUseCase({
      playerRepo,
      messageRepo,
      registrationRepo,
      smsProvider,
      whatsAppProvider,
    }),
    listCampaigns: makeListCampaignsUseCase({ messageRepo }),
  };

  const checkin = {
    scanCheckin: makeScanCheckinUseCase({ registrationRepo, checkinRepo, auditLogRepo }),
    getAttendanceRoster: makeGetAttendanceRosterUseCase({ registrationRepo, checkinRepo }),
  };

  const stats = {
    getPlayerStats: makeGetPlayerStatsUseCase({ statRepo }),
  };

  return {
    prisma,
    playerRepo: playerRepo as PlayerRepository,
    paymentProvider,
    useCases: {
      auth,
      players,
      admin,
      tournaments,
      registrations,
      payments,
      communications,
      checkin,
      stats,
    },
  };
}

export type Container = ReturnType<typeof buildContainer>;
