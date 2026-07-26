import { z } from "zod";
import {
  BATTING_STYLES,
  BOWLING_STYLES,
  PLAYER_TYPES,
  EXPERIENCE_LEVELS,
  GENDERS,
  JERSEY_SIZES,
} from "../constants/enums";
import { MOBILE_REGEX } from "../constants/validation";

export const medicalInfoSchema = z
  .object({
    bloodGroup: z.string().max(10).optional(),
    allergies: z.string().max(500).optional(),
    conditions: z.string().max(500).optional(),
    medication: z.string().max(500).optional(),
  })
  .partial();
export type MedicalInfoInput = z.infer<typeof medicalInfoSchema>;

/**
 * Server-side is the source of truth; the web client mirrors this schema for
 * instant per-field feedback but must never be trusted on its own.
 *
 * Player type (`playerType` — Super Striker/All-Rounder/Batsman/Bowler) is
 * the one field a player never sets themselves: it's deliberately optional
 * here and the only field omitted from `playerSelfInputSchema` below,
 * because an admin assigns it while reviewing the player (see
 * assignCricketProfileSchema). Batting/bowling style is self-reported at
 * registration and editable afterwards; preferred position and experience
 * level aren't collected anywhere in the UI but stay optional here rather
 * than being deleted outright, in case that changes later.
 */
export const playerProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  dateOfBirth: z.coerce.date().refine((d) => d < new Date(), "Date of birth must be in the past"),
  gender: z.enum(GENDERS),
  email: z.string().email().optional().nullable(),

  playerType: z.enum(PLAYER_TYPES).optional(),
  battingStyle: z.enum(BATTING_STYLES),
  bowlingStyle: z.enum(BOWLING_STYLES).default("NONE"),
  preferredBattingPosition: z.coerce.number().int().min(1).max(11).optional(),
  experienceLevel: z.enum(EXPERIENCE_LEVELS).optional(),

  addressLine1: z.string().trim().min(1).max(200),
  addressLine2: z.string().trim().max(200).optional().nullable(),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().min(1).max(100),
  country: z.string().trim().min(1).max(100),
  pincode: z.string().trim().min(1).max(12),

  // Optional — a player may not have this on hand at registration time.
  emergencyContactName: z.string().trim().min(2).max(100).optional().nullable(),
  emergencyContactRelation: z.string().trim().min(2).max(50).optional().nullable(),
  emergencyContactPhone: z.string().regex(MOBILE_REGEX).optional().nullable(),

  jerseySize: z.enum(JERSEY_SIZES),
  jerseyNumberPref1: z.string().max(3).optional().nullable(),
  jerseyNumberPref2: z.string().max(3).optional().nullable(),
  jerseyName: z.string().max(20).optional().nullable(),

  medicalInfo: medicalInfoSchema.optional().nullable(),
});
export type PlayerProfileInput = z.infer<typeof playerProfileSchema>;

/** What a player may submit themselves — at registration or via self-edit. Player type (`playerType`) is omitted (not just optional): sending it here is silently dropped, never persisted. */
export const playerSelfInputSchema = playerProfileSchema.omit({
  playerType: true,
});
export type PlayerSelfInput = z.infer<typeof playerSelfInputSchema>;

/**
 * Admin-only: creates a player profile on behalf of someone who can't complete
 * self-registration themselves (no smartphone, unfamiliar with the OTP flow,
 * assisted in person at a registration desk, etc). Same required fields as
 * self-registration — mobile is the one addition, since there's no OTP step
 * to have already captured it. Player type is still omitted: an admin only
 * ever assigns it during verification review, never at creation, same as
 * self-registered players.
 */
export const adminCreatePlayerSchema = playerSelfInputSchema.extend({
  mobile: z.string().regex(MOBILE_REGEX, "Enter a valid mobile number in E.164 format, e.g. +919876543210"),
});
export type AdminCreatePlayerInput = z.infer<typeof adminCreatePlayerSchema>;

/** Admin-only: assigns/reassigns a player's type while reviewing them. Nothing else about their profile is admin-editable. */
export const assignCricketProfileSchema = z.object({
  playerType: z.enum(PLAYER_TYPES),
});
export type AssignCricketProfileInput = z.infer<typeof assignCricketProfileSchema>;

export const playerSearchQuerySchema = z.object({
  status: z
    .enum(["PENDING_VERIFICATION", "CHANGES_REQUESTED", "VERIFIED", "REJECTED", "SUSPENDED"])
    .optional(),
  q: z.string().optional(),
  city: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type PlayerSearchQuery = z.infer<typeof playerSearchQuerySchema>;

export const rejectPlayerSchema = z.object({
  reason: z.string().trim().min(3).max(500),
});

export const requestChangesSchema = z.object({
  message: z.string().trim().min(3).max(1000),
});
