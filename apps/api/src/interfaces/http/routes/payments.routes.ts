import { Router } from "express";
import { asyncHandler } from "../asyncHandler";
import type { PaymentProvider } from "../../../domain/ports/providers";
import type { PaymentsUseCases } from "../controllers/payments.controller";
import { makePaymentsController } from "../controllers/payments.controller";

/** No authenticate()/requirePlayer() here on purpose — the caller is Razorpay's server, not a logged-in user. Trust is established by the HMAC signature check inside the controller instead. */
export function paymentsRoutes(useCases: PaymentsUseCases, paymentProvider: PaymentProvider): Router {
  const router = Router();
  const controller = makePaymentsController(useCases, paymentProvider);

  router.post("/webhook", asyncHandler(controller.webhook));

  return router;
}
