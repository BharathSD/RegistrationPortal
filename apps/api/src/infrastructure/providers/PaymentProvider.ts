import crypto from "node:crypto";
import type { PaymentProvider, PaymentOrder } from "../../domain/ports/providers";
import { env } from "../../config/env";
import { logger } from "../../config/logger";

/** Dev/test default: creates a fake, already-payable order — no network call. */
export class MockPaymentProvider implements PaymentProvider {
  async createOrder(amount: number, currency: string, receipt: string): Promise<PaymentOrder> {
    const providerOrderId = `mock_order_${crypto.randomUUID()}`;
    logger.info({ providerOrderId, amount, currency, receipt }, "💳 [mock-payment] order created (dev mode)");
    return { providerOrderId, amount, currency };
  }

  verifySignature(): boolean {
    return true;
  }
}

/**
 * Razorpay adapter skeleton. Wire in the `razorpay` SDK (or a raw fetch call
 * to https://api.razorpay.com/v1/orders) once RAZORPAY_KEY_ID/SECRET are
 * configured and PAYMENTS_ENABLED=true. Left as an extension point since
 * payment gateway onboarding (KYC, settlement account) is outside this
 * codebase's control.
 */
export class RazorpayPaymentProvider implements PaymentProvider {
  async createOrder(amount: number, currency: string, receipt: string): Promise<PaymentOrder> {
    if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay credentials are not configured");
    }
    const auth = Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString("base64");
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Math.round(amount * 100), currency, receipt }),
    });
    if (!res.ok) throw new Error(`Razorpay order creation failed: ${res.status} ${await res.text()}`);
    const json = (await res.json()) as { id: string; amount: number; currency: string };
    return { providerOrderId: json.id, amount: json.amount / 100, currency: json.currency };
  }

  verifySignature(payload: { orderId: string; paymentId: string }, signature: string): boolean {
    const expected = crypto
      .createHmac("sha256", env.RAZORPAY_KEY_SECRET ?? "")
      .update(`${payload.orderId}|${payload.paymentId}`)
      .digest("hex");
    return expected === signature;
  }
}

export function createPaymentProvider(): PaymentProvider {
  return env.PAYMENTS_ENABLED ? new RazorpayPaymentProvider() : new MockPaymentProvider();
}
