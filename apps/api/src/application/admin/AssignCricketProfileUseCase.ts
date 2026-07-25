import type { PlayerRepository } from "../../domain/repositories/PlayerRepository";
import type { AuditLogRepository } from "../../domain/repositories/AuditLogRepository";
import type { AssignCricketProfileInput } from "@cricket-platform/shared";
import type { PlayerWithMedical } from "../../domain/entities";
import { NotFoundError } from "../../domain/errors/DomainError";

/**
 * A player never sets their own player type — an admin assigns it while
 * reviewing them, since it's a judgment call (which tier they slot into),
 * not a self-reported fact. Everything else about how they play (batting/
 * bowling style, position, experience) is the player's own and self-edited
 * from their dashboard. Callable independently of approve/reject so an
 * admin can assign or reassign the type at any point.
 */
export function makeAssignCricketProfileUseCase({
  playerRepo,
  auditLogRepo,
}: {
  playerRepo: PlayerRepository;
  auditLogRepo: AuditLogRepository;
}) {
  return async function assignCricketProfile(
    playerId: string,
    input: AssignCricketProfileInput,
    adminId: string,
  ): Promise<PlayerWithMedical> {
    const player = await playerRepo.findById(playerId);
    if (!player) throw new NotFoundError("Player", playerId);

    const updated = await playerRepo.update(playerId, input);

    await auditLogRepo.record({
      actorAdminId: adminId,
      action: "PLAYER_TYPE_ASSIGNED",
      entityType: "Player",
      entityId: playerId,
      before: { cricketRole: player.cricketRole },
      after: { cricketRole: input.cricketRole },
    });

    return updated;
  };
}
