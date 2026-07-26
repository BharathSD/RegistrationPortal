import type { AuditLogRepository } from "../../domain/repositories/AuditLogRepository";
import type { RegisterForTournamentResult, RegistrationDetails } from "./RegisterForTournamentUseCase";

export interface AdminRegisterPlayerForTournamentDeps {
  registerForTournament: (
    playerId: string,
    tournamentId: string,
    rulesAccepted: boolean,
    details?: RegistrationDetails,
  ) => Promise<RegisterForTournamentResult>;
  auditLogRepo: AuditLogRepository;
}

/**
 * Lets an admin add an already-VERIFIED player to a tournament roster
 * directly, for players who can't complete self-service registration on
 * their own. Reuses the exact same eligibility checks as self-service
 * registration (verified status, tournament open/published, capacity,
 * idempotency) — only the actor and the audit trail differ.
 */
export function makeAdminRegisterPlayerForTournamentUseCase({
  registerForTournament,
  auditLogRepo,
}: AdminRegisterPlayerForTournamentDeps) {
  return async function adminRegisterPlayerForTournament(
    tournamentId: string,
    playerId: string,
    adminId: string,
    details: RegistrationDetails = {},
  ): Promise<RegisterForTournamentResult> {
    const result = await registerForTournament(playerId, tournamentId, true, details);

    if (!result.alreadyExisted) {
      await auditLogRepo.record({
        actorAdminId: adminId,
        action: "PLAYER_REGISTERED_BY_ADMIN",
        entityType: "Registration",
        entityId: result.registration.id,
        after: {
          playerId,
          tournamentId,
          status: result.registration.status,
          willingToBowl: result.registration.willingToBowl,
          notes: result.registration.notes,
        },
      });
    }

    return result;
  };
}
