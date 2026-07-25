import type { PlayerRepository } from "../../domain/repositories/PlayerRepository";
import type { AuditLogRepository } from "../../domain/repositories/AuditLogRepository";
import type { AssignCricketProfileInput } from "@cricket-platform/shared";
import type { PlayerWithMedical } from "../../domain/entities";
import { NotFoundError } from "../../domain/errors/DomainError";

/**
 * A player never sets their own playing type — admins assign it after
 * reviewing them (batting/bowling style, role, position, experience are all
 * things an admin can judge better than a self-reported form field, and it
 * keeps the registration wizard short). Callable independently of
 * approve/reject so an admin can assign or revise it at any point.
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
      action: "CRICKET_PROFILE_ASSIGNED",
      entityType: "Player",
      entityId: playerId,
      before: {
        cricketRole: player.cricketRole,
        battingStyle: player.battingStyle,
        bowlingStyle: player.bowlingStyle,
        preferredBattingPosition: player.preferredBattingPosition,
        experienceLevel: player.experienceLevel,
      },
      after: input,
    });

    return updated;
  };
}
