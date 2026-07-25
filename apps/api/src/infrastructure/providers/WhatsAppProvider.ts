import type { WhatsAppProvider, WhatsAppMessage } from "../../domain/ports/providers";
import { logger } from "../../config/logger";
import { env } from "../../config/env";

export class ConsoleWhatsAppProvider implements WhatsAppProvider {
  async send(message: WhatsAppMessage): Promise<{ providerMessageId: string }> {
    logger.info({ message }, "💬 [console-whatsapp] message generated (dev mode — no real WhatsApp send)");
    return { providerMessageId: `console-${Date.now()}` };
  }
}

/**
 * Production adapter for Meta's WhatsApp Business Cloud API. Requires
 * WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_ACCESS_TOKEN and pre-approved message
 * templates (e.g. `player_verified_confirmation`, `tournament_registration_confirmation`).
 */
export class MetaCloudApiWhatsAppProvider implements WhatsAppProvider {
  async send(message: WhatsAppMessage): Promise<{ providerMessageId: string }> {
    const { WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN } = env;
    if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN) {
      throw new Error("WhatsApp Cloud API credentials are not configured");
    }
    const res = await fetch(`https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: message.to,
        type: "template",
        template: {
          name: message.templateName,
          language: { code: "en" },
          components: [
            {
              type: "body",
              parameters: Object.values(message.params).map((text) => ({ type: "text", text })),
            },
          ],
        },
      }),
    });
    if (!res.ok) {
      throw new Error(`WhatsApp send failed: ${res.status} ${await res.text()}`);
    }
    const json = (await res.json()) as { messages?: Array<{ id: string }> };
    return { providerMessageId: json.messages?.[0]?.id ?? "unknown" };
  }
}

export function createWhatsAppProvider(): WhatsAppProvider {
  return env.WHATSAPP_PROVIDER === "meta_cloud_api"
    ? new MetaCloudApiWhatsAppProvider()
    : new ConsoleWhatsAppProvider();
}
