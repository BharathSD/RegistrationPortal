import type { PlayerRepository } from "../../domain/repositories/PlayerRepository";
import type { PlayerWithMedical } from "../../domain/entities";
import { NotFoundError } from "../../domain/errors/DomainError";

export function makeGetPlayerDetailUseCase({ playerRepo }: { playerRepo: PlayerRepository }) {
  return async function getPlayerDetail(playerId: string): Promise<PlayerWithMedical> {
    const player = await playerRepo.findById(playerId);
    if (!player) throw new NotFoundError("Player", playerId);
    return player;
  };
}
