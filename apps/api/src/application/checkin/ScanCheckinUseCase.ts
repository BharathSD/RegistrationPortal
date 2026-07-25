import type { RegistrationRepository } from "../../domain/repositories/RegistrationRepository";
import type { CheckinRepository } from "../../domain/repositories/CheckinRepository";
import type { AuditLogRepository } from "../../domain/repositories/AuditLogRepository";
import { ConflictError, NotFoundError } from "../../domain/errors/DomainError";

export function makeScanCheckinUseCase({
  registrationRepo,
  checkinRepo,
  auditLogRepo,
}: {
  registrationRepo: RegistrationRepository;
  checkinRepo: CheckinRepository;
  auditLogRepo: AuditLogRepository;
}) {
  return async function scanCheckin(
    qrToken: string,
    tournamentId: string,
    scannedByAdminId: string,
    deviceInfo?: string,
  ) {
    const registration = await registrationRepo.findByQrToken(qrToken);
    if (!registration || registration.tournamentId !== tournamentId) {
      throw new NotFoundError("Registration for this tournament", qrToken);
    }
    if (registration.status === "CHECKED_IN") {
      throw new ConflictError("This player has already been checked in");
    }
    if (registration.status !== "CONFIRMED") {
      throw new ConflictError(`Registration is not confirmed (status: ${registration.status})`);
    }

    const checkin = await checkinRepo.create({
      registrationId: registration.id,
      tournamentId,
      scannedByAdminId,
      deviceInfo,
    });
    await registrationRepo.setStatus(registration.id, "CHECKED_IN");

    await auditLogRepo.record({
      actorAdminId: scannedByAdminId,
      action: "PLAYER_CHECKED_IN",
      entityType: "Registration",
      entityId: registration.id,
      after: { checkinId: checkin.id },
    });

    return { checkin, player: registration.player };
  };
}
