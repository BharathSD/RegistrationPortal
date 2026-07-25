import type { RegistrationRepository } from "../../domain/repositories/RegistrationRepository";
import type { PaymentRepository } from "../../domain/repositories/PaymentRepository";
import type { PaymentProvider } from "../../domain/ports/providers";
import { ConflictError, NotFoundError } from "../../domain/errors/DomainError";

export function makeCreatePaymentOrderUseCase({
  registrationRepo,
  paymentRepo,
  paymentProvider,
}: {
  registrationRepo: RegistrationRepository;
  paymentRepo: PaymentRepository;
  paymentProvider: PaymentProvider;
}) {
  return async function createPaymentOrder(registrationId: string) {
    const registration = await registrationRepo.findById(registrationId);
    if (!registration) throw new NotFoundError("Registration", registrationId);
    if (registration.status !== "PENDING_PAYMENT") {
      throw new ConflictError(`Registration is not awaiting payment (status: ${registration.status})`);
    }

    const existingPayment = await paymentRepo.findByRegistrationId(registrationId);
    if (existingPayment && existingPayment.status !== "FAILED") {
      return existingPayment;
    }

    const order = await paymentProvider.createOrder(
      registration.tournament.entryFee,
      "INR",
      `reg_${registrationId}`,
    );

    return paymentRepo.create({
      registrationId,
      amount: registration.tournament.entryFee,
      currency: "INR",
      providerOrderId: order.providerOrderId,
    });
  };
}
