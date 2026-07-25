import type { TournamentRepository } from "../../domain/repositories/TournamentRepository";
import { ConflictError, NotFoundError } from "../../domain/errors/DomainError";

export function makePublishTournamentUseCase({ tournamentRepo }: { tournamentRepo: TournamentRepository }) {
  return async function publishTournament(tournamentId: string) {
    const tournament = await tournamentRepo.findById(tournamentId);
    if (!tournament) throw new NotFoundError("Tournament", tournamentId);
    if (tournament.status !== "DRAFT") {
      throw new ConflictError(`Only a DRAFT tournament can be published (current status: ${tournament.status})`);
    }
    return tournamentRepo.setStatus(tournamentId, "PUBLISHED");
  };
}
