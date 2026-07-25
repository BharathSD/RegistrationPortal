export interface PlayerStatRecord {
  tournamentId: string;
  matchesPlayed: number;
  runsScored: number;
  wicketsTaken: number;
  catches: number;
}

export interface StatRepository {
  upsertMatchStat(data: {
    playerId: string;
    tournamentId: string;
    matchesPlayed?: number;
    runsScored?: number;
    wicketsTaken?: number;
    catches?: number;
  }): Promise<PlayerStatRecord>;
  getByPlayer(playerId: string): Promise<PlayerStatRecord[]>;
}
