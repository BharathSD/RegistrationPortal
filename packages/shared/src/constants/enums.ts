/**
 * Single source of truth for every enum-like value shared between the API
 * and the web client. Keeping these as const arrays (not just TS `enum`)
 * lets Zod build validators directly off the same list Tailwind/React
 * components iterate over for <RadioCardGroup> options.
 */

export const PLAYER_TYPES = ["SUPER_STRIKER", "ALL_ROUNDER", "BATSMAN", "BOWLER"] as const;
export type PlayerType = (typeof PLAYER_TYPES)[number];

export const BATTING_STYLES = ["RIGHT_HAND", "LEFT_HAND"] as const;
export type BattingStyle = (typeof BATTING_STYLES)[number];

export const BOWLING_STYLES = [
  "RIGHT_ARM_FAST",
  "RIGHT_ARM_SPIN",
  "LEFT_ARM_FAST",
  "LEFT_ARM_SPIN",
  "NONE",
] as const;
export type BowlingStyle = (typeof BOWLING_STYLES)[number];

export const EXPERIENCE_LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "PROFESSIONAL"] as const;
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export const GENDERS = ["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"] as const;
export type Gender = (typeof GENDERS)[number];

export const JERSEY_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"] as const;
export type JerseySize = (typeof JERSEY_SIZES)[number];

export const VERIFICATION_STATUSES = [
  "PENDING_VERIFICATION",
  "CHANGES_REQUESTED",
  "VERIFIED",
  "REJECTED",
  "SUSPENDED",
] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const REGISTRATION_STATUSES = [
  "PENDING_PAYMENT",
  "CONFIRMED",
  "CHECKED_IN",
  "CANCELLED",
] as const;
export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number];

export const TOURNAMENT_STATUSES = [
  "DRAFT",
  "PUBLISHED",
  "REGISTRATION_CLOSED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
] as const;
export type TournamentStatus = (typeof TOURNAMENT_STATUSES)[number];

export const PAYMENT_STATUSES = ["CREATED", "SUCCEEDED", "FAILED", "REFUNDED"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const ADMIN_ROLES = ["ADMIN", "SCANNER"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const OTP_PURPOSES = ["REGISTRATION", "LOGIN", "TOURNAMENT_ENTRY"] as const;
export type OtpPurpose = (typeof OTP_PURPOSES)[number];

export const MESSAGE_CHANNELS = ["SMS", "WHATSAPP", "EMAIL"] as const;
export type MessageChannel = (typeof MESSAGE_CHANNELS)[number];

export const DUPLICATE_SIGNALS = [
  "NAME_DOB_MATCH",
  "EMERGENCY_CONTACT_REUSE",
  "PHOTO_HASH_MATCH",
] as const;
export type DuplicateSignal = (typeof DUPLICATE_SIGNALS)[number];

export const DUPLICATE_FLAG_STATUSES = ["OPEN", "DISMISSED", "CONFIRMED_MERGED"] as const;
export type DuplicateFlagStatus = (typeof DUPLICATE_FLAG_STATUSES)[number];

/**
 * Every role that is allowed to authenticate through the admin portal.
 * There is exactly one tier of full access (ADMIN) — a prior SUPER_ADMIN /
 * TOURNAMENT_ADMIN split existed in name only (no route ever required one
 * without the other) and was merged away. SCANNER remains the one genuinely
 * restricted role, for match-day gate volunteers who should only ever be
 * able to scan a QR code — not see medical data, verify players, or send
 * bulk messages. Enforced via requireRole(...) on each route; there is no
 * finer-grained permission system beyond these two roles.
 */
