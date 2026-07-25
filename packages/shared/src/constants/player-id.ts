/**
 * Player ID format: AVI-<SEQ 6 digits> ("AVI" for Aviyukthas) — one simple,
 * global, ever-incrementing sequence. Issued exactly once, at admin-approval
 * time (never at registration time) so rejected/abandoned registrations
 * never burn a sequence number.
 */
export const PLAYER_ID_REGEX = /^AVI-\d{6}$/;

export function buildPlayerId(sequence: number): string {
  return `AVI-${String(sequence).padStart(6, "0")}`;
}
