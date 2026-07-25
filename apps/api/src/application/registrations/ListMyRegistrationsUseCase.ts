import type { RegistrationRepository } from "../../domain/repositories/RegistrationRepository";

export function makeListMyRegistrationsUseCase({ registrationRepo }: { registrationRepo: RegistrationRepository }) {
  return async function listMyRegistrations(playerId: string) {
    return registrationRepo.listByPlayer(playerId);
  };
}
