import type { TournamentRepository } from "../../domain/repositories/TournamentRepository";
import type { TournamentStatus } from "@cricket-platform/shared";

export function makeListTournamentsUseCase({ tournamentRepo }: { tournamentRepo: TournamentRepository }) {
  return async function listTournaments(status?: TournamentStatus) {
    return tournamentRepo.list(status);
  };
}
