import type { PlayerRepository } from "../../domain/repositories/PlayerRepository";
import type { AuditLogRepository } from "../../domain/repositories/AuditLogRepository";
import type { PlayerWithMedical } from "../../domain/entities";
import { NotFoundError } from "../../domain/errors/DomainError";

export function makeRequestChangesUseCase({
  playerRepo,
  auditLogRepo,
}: {
  playerRepo: PlayerRepository;
  auditLogRepo: AuditLogRepository;
}) {
  return async function requestChanges(
    playerId: string,
    message: string,
    adminId: string,
  ): Promise<PlayerWithMedical> {
    const player = await playerRepo.findById(playerId);
    if (!player) throw new NotFoundError("Player", playerId);

    const updated = await playerRepo.setVerificationStatus(playerId, "CHANGES_REQUESTED", {
      changeRequestNote: message,
    });

    await auditLogRepo.record({
      actorAdminId: adminId,
      action: "PLAYER_CHANGES_REQUESTED",
      entityType: "Player",
      entityId: playerId,
      before: { verificationStatus: player.verificationStatus },
      after: { verificationStatus: "CHANGES_REQUESTED", message },
    });

    return updated;
  };
}
