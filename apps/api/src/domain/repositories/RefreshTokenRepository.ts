export interface RefreshTokenRecord {
  id: string;
  playerId: string | null;
  adminId: string | null;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

export interface RefreshTokenRepository {
  create(data: {
    playerId?: string | null;
    adminId?: string | null;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<RefreshTokenRecord>;
  findActiveByHash(tokenHash: string): Promise<RefreshTokenRecord | null>;
  revoke(id: string): Promise<void>;
}
