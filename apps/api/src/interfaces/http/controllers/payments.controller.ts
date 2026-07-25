import type { Request, Response } from "express";
import { logger } from "../../../config/logger";
import { NotFoundError } from "../../../domain/errors/DomainError";
import type { PaymentProvider } from "../../../domain/ports/providers";

export interface PaymentsUseCases {
  confirmPaymentFromWebhook: (params: {
    providerOrderId: string;
    providerPaymentId: string;
    succeeded: boolean;
  }) => Promise<unknown>;
}

interface RazorpayWebhookBody {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
      };
    };
  };
}

const SUCCESS_EVENTS = new Set(["payment.captured", "order.paid"]);
const FAILURE_EVENTS = new Set(["payment.failed"]);

export function makePaymentsController(useCases: PaymentsUseCases, paymentProvider: PaymentProvider) {
  return {
    /**
     * Razorpay webhook receiver. Unauthenticated by JWT — trust comes from
     * the HMAC signature over the raw body instead (see app.ts, where
     * express.json()'s `verify` hook stashes req.rawBody for exactly this).
     * Always acknowledges with 2xx once the signature checks out, even for
     * events this system can't map to a known payment, so the gateway
     * doesn't retry-storm us over test events or races with order creation.
     */
    async webhook(req: Request, res: Response) {
      const signature = req.header("x-razorpay-signature");
      const rawBody = req.rawBody;

      if (!signature || !rawBody || !paymentProvider.verifyWebhookSignature(rawBody, signature)) {
        res.status(400).json({ error: { code: "INVALID_SIGNATURE", message: "Webhook signature is invalid." } });
        return;
      }

      const body = req.body as RazorpayWebhookBody;
      const event = body.event ?? "";
      const orderId = body.payload?.payment?.entity?.order_id;
      const paymentId = body.payload?.payment?.entity?.id;

      if (!orderId || !paymentId || (!SUCCESS_EVENTS.has(event) && !FAILURE_EVENTS.has(event))) {
        // Not an event we act on (e.g. refund/dispute events) — acknowledge
        // without processing so the gateway doesn't keep retrying it.
        res.status(200).json({ received: true, processed: false });
        return;
      }

      try {
        await useCases.confirmPaymentFromWebhook({
          providerOrderId: orderId,
          providerPaymentId: paymentId,
          succeeded: SUCCESS_EVENTS.has(event),
        });
        res.status(200).json({ received: true, processed: true });
      } catch (err) {
        if (err instanceof NotFoundError) {
          logger.warn({ orderId, event }, "Webhook referenced an unknown payment order");
          res.status(200).json({ received: true, processed: false });
          return;
        }
        throw err;
      }
    },
  };
}
