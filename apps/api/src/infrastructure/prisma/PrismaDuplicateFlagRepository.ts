import type { PrismaClient } from "@prisma/client";
import type { DuplicateFlagRepository } from "../../domain/repositories/DuplicateFlagRepository";
import type { DuplicateFlagCandidate, DuplicateFlagWithPlayers } from "../../domain/entities";
import type { DuplicateSignal, DuplicateFlagStatus } from "@cricket-platform/shared";

const playerSummarySelect = {
  id: true,
  fullName: true,
  mobile: true,
  playerId: true,
  verificationStatus: true,
} as const;

function toDomain(f: any): DuplicateFlagCandidate {
  return { ...f, createdAt: f.createdAt.toISOString() };
}

function toDomainWithPlayers(f: any): DuplicateFlagWithPlayers {
  return { ...toDomain(f), player: f.player, suspectedDuplicatePlayer: f.suspectedDuplicatePlayer };
}

export class PrismaDuplicateFlagRepository implements DuplicateFlagRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(data: {
    playerId: string;
    suspectedDuplicatePlayerId: string;
    signal: DuplicateSignal;
  }): Promise<DuplicateFlagCandidate> {
    const flag = await this.db.duplicateFlag.create({ data });
    return toDomain(flag);
  }

  async existsOpenFlag(playerId: string, suspectedDuplicatePlayerId: string): Promise<boolean> {
    const count = await this.db.duplicateFlag.count({
      where: { playerId, suspectedDuplicatePlayerId, status: "OPEN" },
    });
    return count > 0;
  }

  async listOpen(): Promise<DuplicateFlagWithPlayers[]> {
    const items = await this.db.duplicateFlag.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "desc" },
      include: {
        player: { select: playerSummarySelect },
        suspectedDuplicatePlayer: { select: playerSummarySelect },
      },
    });
    return items.map(toDomainWithPlayers);
  }

  async resolve(id: string, status: DuplicateFlagStatus): Promise<DuplicateFlagCandidate> {
    const flag = await this.db.duplicateFlag.update({ where: { id }, data: { status } });
    return toDomain(flag);
  }
}
