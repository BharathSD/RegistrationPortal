import type { TournamentRepository } from "../../domain/repositories/TournamentRepository";
import type { TournamentInput } from "@cricket-platform/shared";
import { slugify } from "./slug";

export function makeCreateTournamentUseCase({ tournamentRepo }: { tournamentRepo: TournamentRepository }) {
  return async function createTournament(input: TournamentInput, createdByAdminId: string) {
    return tournamentRepo.create({ ...input, slug: slugify(input.name), createdByAdminId });
  };
}
