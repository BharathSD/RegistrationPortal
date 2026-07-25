import type { OtpRepository } from "../../domain/repositories/OtpRepository";
import type { PlayerRepository } from "../../domain/repositories/PlayerRepository";
import type { RefreshTokenRepository } from "../../domain/repositories/RefreshTokenRepository";
import type { VerifyOtpInput, PlayerSummary } from "@cricket-platform/shared";
import { NotFoundError, RateLimitError, ValidationError } from "../../domain/errors/DomainError";
import { hashOtpCode, pendingSubjectForMobile } from "./otp.util";
import { signAccessToken, signRefreshToken } from "../../infrastructure/auth/jwt";
import { hashToken } from "../../infrastructure/auth/tokenHash";
import { futureDateFromDuration } from "../../infrastructure/auth/duration";
import { env } from "../../config/env";

export interface VerifyOtpDeps {
  otpRepo: OtpRepository;
  playerRepo: PlayerRepository;
  refreshTokenRepo: RefreshTokenRepository;
}

export interface VerifyOtpResult {
  accessToken: string;
  refreshToken: string;
  player: PlayerSummary | null;
  isNewPlayer: boolean;
}

export function makeVerifyOtpUseCase({ otpRepo, playerRepo, refreshTokenRepo }: VerifyOtpDeps) {
  return async function verifyOtp(input: VerifyOtpInput): Promise<VerifyOtpResult> {
    const challenge = await otpRepo.findLatestActive(input.mobile, input.purpose);
    if (!challenge || challenge.expiresAt < new Date()) {
      throw new ValidationError("Invalid or expired code");
    }
    if (challenge.attempts >= env.OTP_MAX_ATTEMPTS) {
      throw new RateLimitError("Too many incorrect attempts. Please request a new code.");
    }
    if (challenge.codeHash !== hashOtpCode(input.code)) {
      await otpRepo.incrementAttempts(challenge.id);
      throw new ValidationError("Incorrect code");
    }
    await otpRepo.markConsumed(challenge.id);

    const player = await playerRepo.findByMobile(input.mobile);

    if (!player && input.purpose !== "REGISTRATION") {
      throw new NotFoundError("Player profile", input.mobile);
    }

    const sub = player ? player.id : pendingSubjectForMobile(input.mobile);
    const claims = { sub, type: "PLAYER" as const, mobile: input.mobile, purpose: input.purpose };

    const accessToken = signAccessToken(claims);
    const refreshToken = signRefreshToken(claims);
    await refreshTokenRepo.create({
      playerId: player?.id ?? null,
      tokenHash: hashToken(refreshToken),
      expiresAt: futureDateFromDuration(env.JWT_REFRESH_TTL),
    });

    return {
      accessToken,
      refreshToken,
      player: player
        ? { id: player.id, playerId: player.playerId, fullName: player.fullName, verificationStatus: player.verificationStatus }
        : null,
      isNewPlayer: !player,
    };
  };
}
