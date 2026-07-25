import { z } from "zod";
import {
  BATTING_STYLES,
  BOWLING_STYLES,
  CRICKET_ROLES,
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
 * Cricket-profile fields (role, batting/bowling style, position, experience)
 * are deliberately optional here and absent from `playerSelfInputSchema`
 * below — a player never sets their own playing type. An admin assigns it
 * after reviewing the player (see assignCricketProfileSchema).
 */
export const playerProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  dateOfBirth: z.coerce.date().refine((d) => d < new Date(), "Date of birth must be in the past"),
  gender: z.enum(GENDERS),
  email: z.string().email().optional().nullable(),

  cricketRole: z.enum(CRICKET_ROLES).optional(),
  battingStyle: z.enum(BATTING_STYLES).optional(),
  bowlingStyle: z.enum(BOWLING_STYLES).optional(),
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

/** What a player may submit themselves — at registration or via self-edit. Cricket-profile fields are omitted (not just optional): sending them here is silently dropped, never persisted. */
export const playerSelfInputSchema = playerProfileSchema.omit({
  cricketRole: true,
  battingStyle: true,
  bowlingStyle: true,
  preferredBattingPosition: true,
  experienceLevel: true,
});
export type PlayerSelfInput = z.infer<typeof playerSelfInputSchema>;

/** Admin-only: assigns/updates a player's cricket profile after reviewing them. */
export const assignCricketProfileSchema = z.object({
  cricketRole: z.enum(CRICKET_ROLES),
  battingStyle: z.enum(BATTING_STYLES),
  bowlingStyle: z.enum(BOWLING_STYLES).default("NONE"),
  preferredBattingPosition: z.coerce.number().int().min(1).max(11),
  experienceLevel: z.enum(EXPERIENCE_LEVELS),
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
