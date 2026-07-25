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
 *
 * The pepper is intentionally independent from JWT_ACCESS_SECRET: reusing a
 * token-signing secret as a hashing pepper means one leaked secret
 * compromises both token forgery and OTP hash computation. Falls back to
 * JWT_ACCESS_SECRET only when OTP_HASH_PEPPER isn't set, so existing local
 * `.env` files keep working — set OTP_HASH_PEPPER explicitly in production.
 */
export function hashOtpCode(code: string): string {
  return crypto.createHmac("sha256", env.OTP_HASH_PEPPER ?? env.JWT_ACCESS_SECRET).update(code).digest("hex");
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
