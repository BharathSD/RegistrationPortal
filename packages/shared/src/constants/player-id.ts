/**
 * Player ID format: CKT-<STATE_CODE 2 letters>-<YY 2 digits>-<SEQ 6 digits>
 * Issued exactly once, at admin-approval time (never at registration time)
 * so rejected/abandoned registrations never burn a sequence number.
 */
export const PLAYER_ID_REGEX = /^CKT-[A-Z]{2}-\d{2}-\d{6}$/;

export function buildPlayerId(stateCode: string, year: number, sequence: number): string {
  const yy = String(year % 100).padStart(2, "0");
  const seq = String(sequence).padStart(6, "0");
  return `CKT-${stateCode.toUpperCase()}-${yy}-${seq}`;
}
