import type { Tournament } from "@cricket-platform/shared";

export type TournamentTimeframe = "UPCOMING" | "ONGOING" | "PAST";

/** startDate/endDate are "YYYY-MM-DD" strings, so this is a plain lexicographic (= chronological) comparison against today's date in the same format — no Date parsing/timezone footguns. */
export function getTournamentTimeframe(t: Pick<Tournament, "startDate" | "endDate">): TournamentTimeframe {
  const today = new Date().toISOString().slice(0, 10);
  if (t.endDate < today) return "PAST";
  if (t.startDate > today) return "UPCOMING";
  return "ONGOING";
}

/** Groups tournaments by timeframe, each sorted so the most relevant one is first: ongoing/upcoming by soonest start, past by most recently finished. */
export function groupTournamentsByTimeframe<T extends Pick<Tournament, "startDate" | "endDate">>(
  tournaments: T[],
): Record<TournamentTimeframe, T[]> {
  const groups: Record<TournamentTimeframe, T[]> = { ONGOING: [], UPCOMING: [], PAST: [] };
  for (const t of tournaments) {
    groups[getTournamentTimeframe(t)].push(t);
  }
  groups.ONGOING.sort((a, b) => a.startDate.localeCompare(b.startDate));
  groups.UPCOMING.sort((a, b) => a.startDate.localeCompare(b.startDate));
  groups.PAST.sort((a, b) => b.endDate.localeCompare(a.endDate));
  return groups;
}
