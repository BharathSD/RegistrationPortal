import type { TournamentRepository } from "../../domain/repositories/TournamentRepository";
import type { TournamentInput } from "@cricket-platform/shared";
import { NotFoundError } from "../../domain/errors/DomainError";

export function makeUpdateTournamentUseCase({ tournamentRepo }: { tournamentRepo: TournamentRepository }) {
  return async function updateTournament(tournamentId: string, changes: Partial<TournamentInput>) {
    const existing = await tournamentRepo.findById(tournamentId);
    if (!existing) throw new NotFoundError("Tournament", tournamentId);
    return tournamentRepo.update(tournamentId, changes);
  };
}
