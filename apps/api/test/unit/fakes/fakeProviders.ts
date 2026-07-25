import type {
  SmsProvider,
  WhatsAppProvider,
  WhatsAppMessage,
  PaymentProvider,
  PaymentOrder,
} from "../../../src/domain/ports/providers";

export class FakeSmsProvider implements SmsProvider {
  sent: Array<{ mobile: string; code: string }> = [];

  async sendOtp(mobile: string, code: string): Promise<void> {
    this.sent.push({ mobile, code });
  }
}

export class FakeWhatsAppProvider implements WhatsAppProvider {
  sent: WhatsAppMessage[] = [];

  async send(message: WhatsAppMessage): Promise<{ providerMessageId: string }> {
    this.sent.push(message);
    return { providerMessageId: "fake-message-id" };
  }
}

export class FakePaymentProvider implements PaymentProvider {
  orders: Array<{ amount: number; currency: string; receipt: string }> = [];
  signatureIsValid = true;

  async createOrder(amount: number, currency: string, receipt: string): Promise<PaymentOrder> {
    this.orders.push({ amount, currency, receipt });
    return { providerOrderId: `order_${this.orders.length}`, amount, currency };
  }

  verifySignature(): boolean {
    return this.signatureIsValid;
  }
}
