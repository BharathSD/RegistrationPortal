import type { StatRepository } from "../../domain/repositories/StatRepository";

export interface RecordMatchStatInput {
  playerId: string;
  tournamentId: string;
  matchesPlayed?: number;
  runsScored?: number;
  wicketsTaken?: number;
  catches?: number;
}

/**
 * Statistics foundation only — this records incremental match contributions
 * so a future live-scoring integration has a durable place to write to. No
 * scoring engine ships in this codebase yet (see PRD "Out of Scope").
 */
export function makeRecordMatchStatUseCase({ statRepo }: { statRepo: StatRepository }) {
  return async function recordMatchStat(input: RecordMatchStatInput) {
    return statRepo.upsertMatchStat(input);
  };
}
