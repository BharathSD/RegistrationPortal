import type { SmsProvider } from "../../domain/ports/providers";
import { logger } from "../../config/logger";
import { env } from "../../config/env";

/** Dev/test default — logs the OTP instead of calling a paid SMS API. */
export class ConsoleSmsProvider implements SmsProvider {
  async sendOtp(mobile: string, code: string): Promise<void> {
    logger.info({ mobile, code }, "📲 [console-sms] OTP generated (dev mode — no real SMS sent)");
  }
}

/**
 * Production adapter. Requires TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN /
 * TWILIO_FROM_NUMBER. Kept dependency-free (plain fetch to the Twilio REST
 * API) so the api package doesn't need the full twilio SDK as a hard dep.
 */
export class TwilioSmsProvider implements SmsProvider {
  async sendOtp(mobile: string, code: string): Promise<void> {
    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER } = env;
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
      throw new Error("Twilio credentials are not configured");
    }
    const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");
    const body = new URLSearchParams({
      To: mobile,
      From: TWILIO_FROM_NUMBER,
      Body: `Your Cricket Platform verification code is ${code}. It expires in ${Math.floor(env.OTP_TTL_SECONDS / 60)} minutes.`,
    });
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
        body,
      },
    );
    if (!res.ok) {
      throw new Error(`Twilio SMS send failed: ${res.status} ${await res.text()}`);
    }
  }
}

export function createSmsProvider(): SmsProvider {
  return env.SMS_PROVIDER === "twilio" ? new TwilioSmsProvider() : new ConsoleSmsProvider();
}
