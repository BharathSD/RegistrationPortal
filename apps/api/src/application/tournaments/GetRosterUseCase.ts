import type { RegistrationRepository } from "../../domain/repositories/RegistrationRepository";

export function makeGetRosterUseCase({ registrationRepo }: { registrationRepo: RegistrationRepository }) {
  return async function getRoster(tournamentId: string) {
    return registrationRepo.listByTournament(tournamentId);
  };
}
