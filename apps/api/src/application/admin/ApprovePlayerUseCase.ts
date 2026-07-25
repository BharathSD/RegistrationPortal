import type { PlayerRepository } from "../../domain/repositories/PlayerRepository";
import type { AuditLogRepository } from "../../domain/repositories/AuditLogRepository";
import type { WhatsAppProvider } from "../../domain/ports/providers";
import type { PlayerWithMedical } from "../../domain/entities";
import { ConflictError, NotFoundError } from "../../domain/errors/DomainError";

export interface ApprovePlayerDeps {
  playerRepo: PlayerRepository;
  auditLogRepo: AuditLogRepository;
  whatsAppProvider: WhatsAppProvider;
}

export function makeApprovePlayerUseCase({ playerRepo, auditLogRepo, whatsAppProvider }: ApprovePlayerDeps) {
  return async function approvePlayer(playerId: string, adminId: string): Promise<PlayerWithMedical> {
    const player = await playerRepo.findById(playerId);
    if (!player) throw new NotFoundError("Player", playerId);
    if (player.verificationStatus !== "PENDING_VERIFICATION" && player.verificationStatus !== "CHANGES_REQUESTED") {
      throw new ConflictError(`Cannot approve a player in status ${player.verificationStatus}`);
    }
    if (!player.cricketRole) {
      throw new ConflictError("Assign a player type (Super Striker, All-Rounder, Batsman, or Bowler) before approving");
    }

    const updated = await playerRepo.assignNextPlayerId(player.id, adminId);
    const newPlayerId = updated.playerId!;

    await whatsAppProvider.send({
      to: player.mobile,
      templateName: "player_verified_confirmation",
      params: { name: player.fullName, playerId: newPlayerId },
    });

    await auditLogRepo.record({
      actorAdminId: adminId,
      action: "PLAYER_APPROVED",
      entityType: "Player",
      entityId: player.id,
      before: { verificationStatus: player.verificationStatus },
      after: { verificationStatus: "VERIFIED", playerId: newPlayerId },
    });

    return updated;
  };
}
