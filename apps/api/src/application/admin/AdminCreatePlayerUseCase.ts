import type { AuditLogRepository } from "../../domain/repositories/AuditLogRepository";
import type { AdminCreatePlayerInput, PlayerProfileInput } from "@cricket-platform/shared";
import type { PlayerWithMedical, DuplicateFlagCandidate } from "../../domain/entities";

export interface AdminCreatePlayerDeps {
  registerPlayer: (mobile: string, profile: PlayerProfileInput) => Promise<PlayerWithMedical>;
  detectDuplicates: (playerId: string) => Promise<DuplicateFlagCandidate[]>;
  auditLogRepo: AuditLogRepository;
}

/**
 * Lets an admin create a player profile on behalf of someone who can't
 * complete self-registration themselves (no smartphone, unfamiliar with the
 * OTP flow, assisted in person at a registration desk). Reuses the same
 * create-and-conflict-check logic and duplicate detection as self-service
 * registration — the only difference is who's typing and that there's no
 * OTP session to issue afterwards. The player lands in PENDING_VERIFICATION
 * just like a self-registered one, so it still goes through the normal
 * verification queue (player type assignment, approve/reject).
 */
export function makeAdminCreatePlayerUseCase({ registerPlayer, detectDuplicates, auditLogRepo }: AdminCreatePlayerDeps) {
  return async function adminCreatePlayer(input: AdminCreatePlayerInput, adminId: string): Promise<PlayerWithMedical> {
    const { mobile, ...profile } = input;
    const player = await registerPlayer(mobile, profile);
    await detectDuplicates(player.id);

    await auditLogRepo.record({
      actorAdminId: adminId,
      action: "PLAYER_CREATED_BY_ADMIN",
      entityType: "Player",
      entityId: player.id,
      after: { mobile, fullName: player.fullName },
    });

    return player;
  };
}
