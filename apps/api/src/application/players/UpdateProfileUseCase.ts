import type { PlayerRepository } from "../../domain/repositories/PlayerRepository";
import type { PlayerProfileInput } from "@cricket-platform/shared";
import type { PlayerWithMedical } from "../../domain/entities";
import { NotFoundError } from "../../domain/errors/DomainError";

export function makeUpdateProfileUseCase({ playerRepo }: { playerRepo: PlayerRepository }) {
  return async function updateProfile(
    playerId: string,
    changes: Partial<PlayerProfileInput>,
  ): Promise<PlayerWithMedical> {
    const existing = await playerRepo.findById(playerId);
    if (!existing) throw new NotFoundError("Player", playerId);

    const updated = await playerRepo.update(playerId, changes);

    // A previously VERIFIED profile must be re-reviewed after any self-edit —
    // the Player ID and card stay valid, but the edited profile re-enters the queue.
    if (existing.verificationStatus === "VERIFIED") {
      return playerRepo.setVerificationStatus(playerId, "PENDING_VERIFICATION");
    }
    return updated;
  };
}
