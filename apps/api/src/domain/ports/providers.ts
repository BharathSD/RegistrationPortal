/**
 * Ports for every external, side-effecting dependency the application layer
 * needs. Each has a "console" dev implementation (infrastructure/providers)
 * so the entire product can be built/tested end-to-end without live
 * Twilio/Meta/Razorpay credentials, and a real implementation swapped in via
 * env var at the composition root (container.ts).
 */

export interface SmsProvider {
  sendOtp(mobile: string, code: string): Promise<void>;
}

export interface WhatsAppMessage {
  to: string;
  templateName: string;
  params: Record<string, string>;
}

export interface WhatsAppProvider {
  send(message: WhatsAppMessage): Promise<{ providerMessageId: string }>;
}

export interface PaymentOrder {
  providerOrderId: string;
  amount: number;
  currency: string;
}

export interface PaymentProvider {
  createOrder(amount: number, currency: string, receipt: string): Promise<PaymentOrder>;
  /** Verifies the client checkout-callback signature (order_id|payment_id). */
  verifySignature(payload: unknown, signature: string): boolean;
  /** Verifies a server-to-server webhook delivery's signature over the raw request body. */
  verifyWebhookSignature(rawBody: Buffer, signature: string): boolean;
}

export interface StoredFile {
  url: string;
  key: string;
}

export interface StorageProvider {
  saveBuffer(buffer: Buffer, options: { keyPrefix: string; contentType: string }): Promise<StoredFile>;
}

export interface QrCodeGenerator {
  toDataUrl(payload: string): Promise<string>;
}
