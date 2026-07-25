import type { RegistrationRepository } from "../../domain/repositories/RegistrationRepository";
import { ConflictError, NotFoundError } from "../../domain/errors/DomainError";

export function makeCancelRegistrationUseCase({ registrationRepo }: { registrationRepo: RegistrationRepository }) {
  return async function cancelRegistration(playerId: string, registrationId: string) {
    const registration = await registrationRepo.findById(registrationId);
    // Same NotFoundError for "doesn't exist" and "isn't yours" — a distinct
    // ForbiddenError here would let a caller enumerate valid registration
    // IDs belonging to other players.
    if (!registration || registration.playerId !== playerId) {
      throw new NotFoundError("Registration", registrationId);
    }
    if (registration.status === "CHECKED_IN") {
      throw new ConflictError("Cannot cancel a registration that has already been checked in");
    }
    return registrationRepo.setStatus(registrationId, "CANCELLED");
  };
}
