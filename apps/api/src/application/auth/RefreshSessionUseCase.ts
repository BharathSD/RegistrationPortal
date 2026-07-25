import type { RefreshTokenRepository } from "../../domain/repositories/RefreshTokenRepository";
import { UnauthorizedError } from "../../domain/errors/DomainError";
import { verifyRefreshToken, signAccessToken, signRefreshToken } from "../../infrastructure/auth/jwt";
import { hashToken } from "../../infrastructure/auth/tokenHash";
import { futureDateFromDuration } from "../../infrastructure/auth/duration";
import { env } from "../../config/env";

export interface RefreshSessionDeps {
  refreshTokenRepo: RefreshTokenRepository;
}

/** Rotation-on-use: the presented refresh token is revoked and a brand new pair is issued, so a stolen-but-unused token is single-use. */
export function makeRefreshSessionUseCase({ refreshTokenRepo }: RefreshSessionDeps) {
  return async function refreshSession(refreshToken: string) {
    let claims;
    try {
      claims = verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError("Invalid or expired refresh token");
    }

    const record = await refreshTokenRepo.findActiveByHash(hashToken(refreshToken));
    if (!record) {
      throw new UnauthorizedError("Refresh token has been revoked or already used");
    }
    await refreshTokenRepo.revoke(record.id);

    const newAccessToken = signAccessToken(claims);
    const newRefreshToken = signRefreshToken(claims);
    await refreshTokenRepo.create({
      playerId: record.playerId,
      adminId: record.adminId,
      tokenHash: hashToken(newRefreshToken),
      expiresAt: futureDateFromDuration(env.JWT_REFRESH_TTL),
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  };
}
