import type { StatRepository } from "../../domain/repositories/StatRepository";

export function makeGetPlayerStatsUseCase({ statRepo }: { statRepo: StatRepository }) {
  return async function getPlayerStats(playerId: string) {
    const perTournament = await statRepo.getByPlayer(playerId);
    const totals = perTournament.reduce(
      (acc, s) => ({
        matchesPlayed: acc.matchesPlayed + s.matchesPlayed,
        runsScored: acc.runsScored + s.runsScored,
        wicketsTaken: acc.wicketsTaken + s.wicketsTaken,
        catches: acc.catches + s.catches,
      }),
      { matchesPlayed: 0, runsScored: 0, wicketsTaken: 0, catches: 0 },
    );
    return { totals, perTournament };
  };
}
