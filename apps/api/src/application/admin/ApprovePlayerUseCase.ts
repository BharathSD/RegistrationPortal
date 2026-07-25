import { buildPlayerId } from "@cricket-platform/shared";
import type { PlayerRepository } from "../../domain/repositories/PlayerRepository";
import type { AuditLogRepository } from "../../domain/repositories/AuditLogRepository";
import type { WhatsAppProvider } from "../../domain/ports/providers";
import type { PlayerWithMedical } from "../../domain/entities";
import { ConflictError, NotFoundError } from "../../domain/errors/DomainError";
import { stateCodeFromName } from "./stateCode";

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

    const stateCode = stateCodeFromName(player.state);
    const year = new Date().getFullYear();
    const sequence = (await playerRepo.countApprovedInStateForYear(stateCode, year)) + 1;
    const newPlayerId = buildPlayerId(stateCode, year, sequence);

    const updated = await playerRepo.assignPlayerId(player.id, newPlayerId, adminId);

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
