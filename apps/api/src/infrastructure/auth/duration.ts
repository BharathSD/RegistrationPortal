const UNIT_MS: Record<string, number> = {
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

/** Parses simple durations like "15m", "30d", "1h" (the same format used for JWT_*_TTL) into a future Date. */
export function futureDateFromDuration(duration: string): Date {
  const match = /^(\d+)([smhd])$/.exec(duration.trim());
  if (!match) throw new Error(`Invalid duration string: ${duration}`);
  const [, amountStr, unit] = match;
  return new Date(Date.now() + Number(amountStr) * UNIT_MS[unit]);
}
