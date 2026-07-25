import crypto from "node:crypto";
import { env } from "../../config/env";

export function generateOtpCode(): string {
  const max = 10 ** env.OTP_LENGTH;
  const n = crypto.randomInt(0, max);
  return String(n).padStart(env.OTP_LENGTH, "0");
}

/**
 * SHA-256 with a server-side pepper is sufficient here (not bcrypt): OTPs
 * are short-lived (OTP_TTL_SECONDS) and attempt-limited (OTP_MAX_ATTEMPTS),
 * so the slow, salted hashing bcrypt provides for long-lived passwords
 * buys little while adding CPU cost to a high-frequency code path.
 */
export function hashOtpCode(code: string): string {
  return crypto.createHmac("sha256", env.JWT_ACCESS_SECRET).update(code).digest("hex");
}

export function otpExpiryDate(): Date {
  return new Date(Date.now() + env.OTP_TTL_SECONDS * 1000);
}

export const PENDING_SUBJECT_PREFIX = "pending:";

export function pendingSubjectForMobile(mobile: string): string {
  return `${PENDING_SUBJECT_PREFIX}${mobile}`;
}

export function isPendingSubject(sub: string): boolean {
  return sub.startsWith(PENDING_SUBJECT_PREFIX);
}
