import type { RegistrationRepository } from "../../domain/repositories/RegistrationRepository";
import { ConflictError, NotFoundError } from "../../domain/errors/DomainError";

export function makeCancelRegistrationUseCase({ registrationRepo }: { registrationRepo: RegistrationRepository }) {
  return async function cancelRegistration(registrationId: string) {
    const registration = await registrationRepo.findById(registrationId);
    if (!registration) throw new NotFoundError("Registration", registrationId);
    if (registration.status === "CHECKED_IN") {
      throw new ConflictError("Cannot cancel a registration that has already been checked in");
    }
    return registrationRepo.setStatus(registrationId, "CANCELLED");
  };
}
