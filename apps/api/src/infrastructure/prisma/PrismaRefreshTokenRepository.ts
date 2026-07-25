import type { PrismaClient } from "@prisma/client";
import type {
  RefreshTokenRepository,
  RefreshTokenRecord,
} from "../../domain/repositories/RefreshTokenRepository";

export class PrismaRefreshTokenRepository implements RefreshTokenRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(data: {
    playerId?: string | null;
    adminId?: string | null;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<RefreshTokenRecord> {
    return this.db.refreshToken.create({
      data: {
        playerId: data.playerId ?? null,
        adminId: data.adminId ?? null,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
      },
    });
  }

  async findActiveByHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    return this.db.refreshToken.findFirst({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
    });
  }

  async findByHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    return this.db.refreshToken.findFirst({ where: { tokenHash } });
  }

  async revoke(id: string): Promise<void> {
    await this.db.refreshToken.update({ where: { id }, data: { revokedAt: new Date() } });
  }

  async revokeAllActive(subject: { playerId?: string | null; adminId?: string | null }): Promise<void> {
    await this.db.refreshToken.updateMany({
      where: {
        revokedAt: null,
        ...(subject.playerId ? { playerId: subject.playerId } : {}),
        ...(subject.adminId ? { adminId: subject.adminId } : {}),
      },
      data: { revokedAt: new Date() },
    });
  }
}
