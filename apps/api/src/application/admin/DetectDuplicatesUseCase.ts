import type { PlayerRepository } from "../../domain/repositories/PlayerRepository";
import type { DuplicateFlagRepository } from "../../domain/repositories/DuplicateFlagRepository";
import type { DuplicateFlagCandidate } from "../../domain/entities";

/**
 * Runs after a new player registration (or profile edit) to surface likely
 * duplicate identities to admins before they approve/reject. Deliberately
 * cheap heuristics (exact name+DOB, reused emergency contact) rather than
 * fuzzy matching — false positives just add an admin review step, false
 * negatives are cheaper to tolerate than a slow registration flow.
 */
export function makeDetectDuplicatesUseCase({
  playerRepo,
  duplicateFlagRepo,
}: {
  playerRepo: PlayerRepository;
  duplicateFlagRepo: DuplicateFlagRepository;
}) {
  return async function detectDuplicates(playerId: string): Promise<DuplicateFlagCandidate[]> {
    const player = await playerRepo.findById(playerId);
    if (!player) return [];

    const candidates = await playerRepo.findPotentialDuplicates(player);
    const flags: DuplicateFlagCandidate[] = [];

    for (const candidate of candidates) {
      const alreadyFlagged = await duplicateFlagRepo.existsOpenFlag(player.id, candidate.id);
      if (alreadyFlagged) continue;

      const signal =
        candidate.emergencyContactPhone === player.emergencyContactPhone
          ? "EMERGENCY_CONTACT_REUSE"
          : "NAME_DOB_MATCH";

      flags.push(
        await duplicateFlagRepo.create({
          playerId: player.id,
          suspectedDuplicatePlayerId: candidate.id,
          signal,
        }),
      );
    }

    return flags;
  };
}
