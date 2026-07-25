import type { RefreshTokenRepository } from "../../domain/repositories/RefreshTokenRepository";
import { hashToken } from "../../infrastructure/auth/tokenHash";

/**
 * Revokes the presented refresh token so it can't be used again after the
 * client logs out — clearing the httpOnly cookie alone only stops *this*
 * browser from presenting it; a copy captured before logout (e.g. via a
 * proxy log) would otherwise still work until it expired on its own.
 * Silently no-ops for a missing/already-revoked token — logout should never
 * fail visibly just because the session was already gone.
 */
export function makeLogoutUseCase({ refreshTokenRepo }: { refreshTokenRepo: RefreshTokenRepository }) {
  return async function logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) return;
    const record = await refreshTokenRepo.findByHash(hashToken(refreshToken));
    if (record && !record.revokedAt) {
      await refreshTokenRepo.revoke(record.id);
    }
  };
}
