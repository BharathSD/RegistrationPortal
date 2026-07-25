import type { TournamentRepository } from "../../domain/repositories/TournamentRepository";
import { NotFoundError } from "../../domain/errors/DomainError";

export function makeGetTournamentUseCase({ tournamentRepo }: { tournamentRepo: TournamentRepository }) {
  return async function getTournament(tournamentId: string) {
    const tournament = await tournamentRepo.findById(tournamentId);
    if (!tournament) throw new NotFoundError("Tournament", tournamentId);
    return tournament;
  };
}
