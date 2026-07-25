import type { RefreshTokenRepository } from "../../domain/repositories/RefreshTokenRepository";
import { signAccessToken, signRefreshToken } from "../../infrastructure/auth/jwt";
import { hashToken } from "../../infrastructure/auth/tokenHash";
import { futureDateFromDuration } from "../../infrastructure/auth/duration";
import { env } from "../../config/env";

/**
 * Mints a fresh, fully-scoped player session once a profile now exists.
 * Needed right after RegisterPlayerUseCase: the token the client is holding
 * up to that point still carries the pre-registration "pending:<mobile>"
 * subject (see application/auth/otp.util.ts), which /players/me and
 * /players/me/photo deliberately reject — this exchanges it for a real one
 * without requiring the player to re-verify an OTP.
 */
export function makeIssueSessionForPlayerUseCase({ refreshTokenRepo }: { refreshTokenRepo: RefreshTokenRepository }) {
  return async function issueSessionForPlayer(playerId: string, mobile: string) {
    const claims = { sub: playerId, type: "PLAYER" as const, mobile };
    const accessToken = signAccessToken(claims);
    const refreshToken = signRefreshToken(claims);
    await refreshTokenRepo.create({
      playerId,
      tokenHash: hashToken(refreshToken),
      expiresAt: futureDateFromDuration(env.JWT_REFRESH_TTL),
    });
    return { accessToken, refreshToken };
  };
}
