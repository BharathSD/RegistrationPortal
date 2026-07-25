import type { PlayerRepository } from "../../domain/repositories/PlayerRepository";
import type { RefreshTokenRepository } from "../../domain/repositories/RefreshTokenRepository";
import type { AuditLogRepository } from "../../domain/repositories/AuditLogRepository";
import { NotFoundError } from "../../domain/errors/DomainError";

export function makeDeletePlayerUseCase({
  playerRepo,
  refreshTokenRepo,
  auditLogRepo,
}: {
  playerRepo: PlayerRepository;
  refreshTokenRepo: RefreshTokenRepository;
  auditLogRepo: AuditLogRepository;
}) {
  return async function deletePlayer(playerId: string, adminId: string) {
    const player = await playerRepo.findById(playerId);
    if (!player) throw new NotFoundError("Player", playerId);
    await playerRepo.softDelete(playerId);
    // Soft delete alone doesn't stop a session already in flight — the auth
    // middleware checks player existence on every request (see
    // requireActivePlayer in middleware/auth.ts), but a deleted player's
    // refresh tokens must also be revoked so they can't silently mint a new
    // access token for up to JWT_REFRESH_TTL after being deleted.
    await refreshTokenRepo.revokeAllActive({ playerId });
    await auditLogRepo.record({
      actorAdminId: adminId,
      action: "PLAYER_DELETED",
      entityType: "Player",
      entityId: playerId,
      before: { verificationStatus: player.verificationStatus },
    });
  };
}
