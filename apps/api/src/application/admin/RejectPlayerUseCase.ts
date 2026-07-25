import type { PlayerRepository } from "../../domain/repositories/PlayerRepository";
import type { AuditLogRepository } from "../../domain/repositories/AuditLogRepository";
import type { PlayerWithMedical } from "../../domain/entities";
import { ConflictError, NotFoundError } from "../../domain/errors/DomainError";

export function makeRejectPlayerUseCase({
  playerRepo,
  auditLogRepo,
}: {
  playerRepo: PlayerRepository;
  auditLogRepo: AuditLogRepository;
}) {
  return async function rejectPlayer(playerId: string, reason: string, adminId: string): Promise<PlayerWithMedical> {
    const player = await playerRepo.findById(playerId);
    if (!player) throw new NotFoundError("Player", playerId);
    if (player.verificationStatus === "VERIFIED") {
      throw new ConflictError("A verified player cannot be rejected — suspend instead");
    }

    const updated = await playerRepo.setVerificationStatus(playerId, "REJECTED", { rejectionReason: reason });

    await auditLogRepo.record({
      actorAdminId: adminId,
      action: "PLAYER_REJECTED",
      entityType: "Player",
      entityId: playerId,
      before: { verificationStatus: player.verificationStatus },
      after: { verificationStatus: "REJECTED", reason },
    });

    return updated;
  };
}
