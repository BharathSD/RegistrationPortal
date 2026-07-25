import type { PlayerRepository, PlayerSearchFilters } from "../../domain/repositories/PlayerRepository";

export function makeSearchPlayersUseCase({ playerRepo }: { playerRepo: PlayerRepository }) {
  return async function searchPlayers(filters: PlayerSearchFilters) {
    return playerRepo.search(filters);
  };
}
