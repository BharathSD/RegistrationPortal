import crypto from "node:crypto";
import type {
  RefreshTokenRepository,
  RefreshTokenRecord,
} from "../../../src/domain/repositories/RefreshTokenRepository";

export class InMemoryRefreshTokenRepository implements RefreshTokenRepository {
  tokens: RefreshTokenRecord[] = [];

  async create(data: {
    playerId?: string | null;
    adminId?: string | null;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<RefreshTokenRecord> {
    const record: RefreshTokenRecord = {
      id: crypto.randomUUID(),
      playerId: data.playerId ?? null,
      adminId: data.adminId ?? null,
      tokenHash: data.tokenHash,
      expiresAt: data.expiresAt,
      revokedAt: null,
    };
    this.tokens.push(record);
    return record;
  }

  async findActiveByHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    return (
      this.tokens.find((t) => t.tokenHash === tokenHash && !t.revokedAt && t.expiresAt > new Date()) ?? null
    );
  }

  async findByHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    return this.tokens.find((t) => t.tokenHash === tokenHash) ?? null;
  }

  async revoke(id: string): Promise<void> {
    const record = this.tokens.find((t) => t.id === id);
    if (record) record.revokedAt = new Date();
  }

  async revokeAllActive(subject: { playerId?: string | null; adminId?: string | null }): Promise<void> {
    for (const t of this.tokens) {
      if (t.revokedAt) continue;
      if (subject.playerId && t.playerId === subject.playerId) t.revokedAt = new Date();
      if (subject.adminId && t.adminId === subject.adminId) t.revokedAt = new Date();
    }
  }
}
