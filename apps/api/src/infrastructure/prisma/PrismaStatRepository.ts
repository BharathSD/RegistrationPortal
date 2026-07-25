import type { PrismaClient } from "@prisma/client";
import type { StatRepository, PlayerStatRecord } from "../../domain/repositories/StatRepository";

export class PrismaStatRepository implements StatRepository {
  constructor(private readonly db: PrismaClient) {}

  async upsertMatchStat(data: {
    playerId: string;
    tournamentId: string;
    matchesPlayed?: number;
    runsScored?: number;
    wicketsTaken?: number;
    catches?: number;
  }): Promise<PlayerStatRecord> {
    const stat = await this.db.playerStat.upsert({
      where: { playerId_tournamentId: { playerId: data.playerId, tournamentId: data.tournamentId } },
      create: {
        playerId: data.playerId,
        tournamentId: data.tournamentId,
        matchesPlayed: data.matchesPlayed ?? 0,
        runsScored: data.runsScored ?? 0,
        wicketsTaken: data.wicketsTaken ?? 0,
        catches: data.catches ?? 0,
      },
      update: {
        matchesPlayed: { increment: data.matchesPlayed ?? 0 },
        runsScored: { increment: data.runsScored ?? 0 },
        wicketsTaken: { increment: data.wicketsTaken ?? 0 },
        catches: { increment: data.catches ?? 0 },
      },
    });
    return stat;
  }

  async getByPlayer(playerId: string): Promise<PlayerStatRecord[]> {
    return this.db.playerStat.findMany({ where: { playerId } });
  }
}
