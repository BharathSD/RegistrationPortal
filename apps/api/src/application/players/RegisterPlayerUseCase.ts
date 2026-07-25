import type { PlayerRepository } from "../../domain/repositories/PlayerRepository";
import type { PlayerProfileInput } from "@cricket-platform/shared";
import type { PlayerWithMedical } from "../../domain/entities";
import { ConflictError } from "../../domain/errors/DomainError";

export interface RegisterPlayerDeps {
  playerRepo: PlayerRepository;
}

export function makeRegisterPlayerUseCase({ playerRepo }: RegisterPlayerDeps) {
  return async function registerPlayer(mobile: string, profile: PlayerProfileInput): Promise<PlayerWithMedical> {
    const existing = await playerRepo.findByMobile(mobile);
    if (existing) {
      throw new ConflictError("A player profile already exists for this mobile number");
    }
    return playerRepo.create({ ...profile, mobile });
  };
}
