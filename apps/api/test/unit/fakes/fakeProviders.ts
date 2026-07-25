import type { SmsProvider, WhatsAppProvider, WhatsAppMessage } from "../../../src/domain/ports/providers";

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
