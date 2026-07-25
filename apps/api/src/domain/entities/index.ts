/**
 * Domain entities are the shared, framework-free shapes the application
 * layer operates on. We reuse the @cricket-platform/shared types so the API
 * and the web client never drift, and add API-only fields (e.g. medical
 * info, admin-only data) that must never leak into the public shared package.
 */
import type { Player as SharedPlayer, MedicalInfo } from "@cricket-platform/shared";

export type Player = SharedPlayer;
export type { MedicalInfo };

export interface PlayerWithMedical extends Player {
  medicalInfo?: MedicalInfo | null;
}

export interface DuplicateFlagCandidate {
  id: string;
  playerId: string;
  suspectedDuplicatePlayerId: string;
  signal: "NAME_DOB_MATCH" | "EMERGENCY_CONTACT_REUSE" | "PHOTO_HASH_MATCH";
  status: "OPEN" | "DISMISSED" | "CONFIRMED_MERGED";
  createdAt: string;
}

export interface DuplicateFlagPlayerSummary {
  id: string;
  fullName: string;
  mobile: string;
  playerId: string | null;
  verificationStatus: string;
}

/** What the admin duplicate-review list actually needs to render — the flag plus who the two players are, not just their ids. */
export interface DuplicateFlagWithPlayers extends DuplicateFlagCandidate {
  player: DuplicateFlagPlayerSummary;
  suspectedDuplicatePlayer: DuplicateFlagPlayerSummary;
}
