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
  /** Unfiltered lookup — used to tell "revoked/expired" apart from "never existed" when deciding whether a presented token is a breach signal. */
  findByHash(tokenHash: string): Promise<RefreshTokenRecord | null>;
  revoke(id: string): Promise<void>;
  /** Revokes every currently-active token for a subject — used on account deletion/rejection and on refresh-token breach detection. */
  revokeAllActive(subject: { playerId?: string | null; adminId?: string | null }): Promise<void>;
}
