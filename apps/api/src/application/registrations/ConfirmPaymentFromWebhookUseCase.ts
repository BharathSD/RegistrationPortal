import type { PaymentRepository } from "../../domain/repositories/PaymentRepository";
import type { RegistrationRepository } from "../../domain/repositories/RegistrationRepository";
import { NotFoundError } from "../../domain/errors/DomainError";

/**
 * Applies a payment-gateway webhook event to our own Payment/Registration
 * records. This is the piece that used to be missing entirely: order
 * creation existed, but nothing ever transitioned a Payment out of CREATED
 * or a Registration out of PENDING_PAYMENT. Idempotent by design — gateways
 * retry webhook delivery, so re-delivering an already-applied event must be
 * a no-op rather than a duplicate side effect.
 */
export function makeConfirmPaymentFromWebhookUseCase({
  paymentRepo,
  registrationRepo,
}: {
  paymentRepo: PaymentRepository;
  registrationRepo: RegistrationRepository;
}) {
  return async function confirmPaymentFromWebhook(params: {
    providerOrderId: string;
    providerPaymentId: string;
    succeeded: boolean;
  }) {
    const { providerOrderId, providerPaymentId, succeeded } = params;
    const payment = await paymentRepo.findByProviderOrderId(providerOrderId);
    if (!payment) throw new NotFoundError("Payment", providerOrderId);

    // Already applied (webhook redelivery, or the client-side confirm path
    // beat the webhook to it) — don't re-run side effects.
    if (payment.status === "SUCCEEDED" || payment.status === "FAILED") {
      return payment;
    }

    const updated = await paymentRepo.updateStatus(
      payment.id,
      succeeded ? "SUCCEEDED" : "FAILED",
      providerPaymentId,
    );

    if (succeeded) {
      await registrationRepo.setStatus(payment.registrationId, "CONFIRMED");
    }

    return updated;
  };
}
