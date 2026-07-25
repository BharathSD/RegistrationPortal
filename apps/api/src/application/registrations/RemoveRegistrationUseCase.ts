import type { RegistrationRepository } from "../../domain/repositories/RegistrationRepository";
import type { AuditLogRepository } from "../../domain/repositories/AuditLogRepository";
import { NotFoundError } from "../../domain/errors/DomainError";

/** Admin-initiated removal of a player from a tournament roster — unlike self-service cancellation, this deletes the registration outright so the player can register again later if needed. */
export function makeRemoveRegistrationUseCase({
  registrationRepo,
  auditLogRepo,
}: {
  registrationRepo: RegistrationRepository;
  auditLogRepo: AuditLogRepository;
}) {
  return async function removeRegistration(tournamentId: string, registrationId: string, adminId: string) {
    const registration = await registrationRepo.findById(registrationId);
    if (!registration || registration.tournamentId !== tournamentId) {
      throw new NotFoundError("Registration", registrationId);
    }
    await registrationRepo.remove(registrationId);
    await auditLogRepo.record({
      actorAdminId: adminId,
      action: "REGISTRATION_REMOVED",
      entityType: "Registration",
      entityId: registrationId,
      before: { playerId: registration.playerId, tournamentId, status: registration.status },
    });
  };
}
