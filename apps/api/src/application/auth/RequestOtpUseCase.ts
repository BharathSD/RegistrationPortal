import type { OtpRepository } from "../../domain/repositories/OtpRepository";
import type { SmsProvider } from "../../domain/ports/providers";
import type { RequestOtpInput } from "@cricket-platform/shared";
import { RateLimitError } from "../../domain/errors/DomainError";
import { generateOtpCode, hashOtpCode, otpExpiryDate } from "./otp.util";
import { env } from "../../config/env";

export interface RequestOtpDeps {
  otpRepo: OtpRepository;
  smsProvider: SmsProvider;
}

export interface RequestOtpResult {
  expiresInSeconds: number;
  /**
   * Only ever populated outside production while SMS_PROVIDER=console —
   * i.e. exactly when no real SMS was sent anywhere for a human to read.
   * Lets the web client surface the code directly instead of requiring
   * access to the API process's stdout, which a deployed/backgrounded dev
   * server usually doesn't offer. Never returned when a real provider
   * (Twilio/MSG91) is configured, and never in NODE_ENV=production.
   */
  devCode?: string;
}

export function makeRequestOtpUseCase({ otpRepo, smsProvider }: RequestOtpDeps) {
  return async function requestOtp(input: RequestOtpInput): Promise<RequestOtpResult> {
    const existing = await otpRepo.findLatestActive(input.mobile, input.purpose);
    if (existing) {
      const secondsSinceCreated = (Date.now() - existing.createdAt.getTime()) / 1000;
      if (secondsSinceCreated < env.OTP_RESEND_COOLDOWN_SECONDS) {
        throw new RateLimitError(
          `Please wait ${Math.ceil(env.OTP_RESEND_COOLDOWN_SECONDS - secondsSinceCreated)}s before requesting another code`,
        );
      }
    }

    const code = generateOtpCode();
    await otpRepo.createChallenge({
      mobile: input.mobile,
      codeHash: hashOtpCode(code),
      purpose: input.purpose,
      expiresAt: otpExpiryDate(),
    });

    await smsProvider.sendOtp(input.mobile, code);

    const exposeDevCode = env.NODE_ENV !== "production" && env.SMS_PROVIDER === "console";
    return { expiresInSeconds: env.OTP_TTL_SECONDS, ...(exposeDevCode ? { devCode: code } : {}) };
  };
}
