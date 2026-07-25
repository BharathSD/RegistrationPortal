import bcrypt from "bcryptjs";
import type { AdminUserRepository } from "../../domain/repositories/AdminUserRepository";
import type { RefreshTokenRepository } from "../../domain/repositories/RefreshTokenRepository";
import type { AdminLoginInput } from "@cricket-platform/shared";
import { UnauthorizedError } from "../../domain/errors/DomainError";
import { signAccessToken, signRefreshToken } from "../../infrastructure/auth/jwt";
import { hashToken } from "../../infrastructure/auth/tokenHash";
import { futureDateFromDuration } from "../../infrastructure/auth/duration";
import { env } from "../../config/env";

export interface AdminLoginDeps {
  adminUserRepo: AdminUserRepository;
  refreshTokenRepo: RefreshTokenRepository;
}

export function makeAdminLoginUseCase({ adminUserRepo, refreshTokenRepo }: AdminLoginDeps) {
  return async function adminLogin(input: AdminLoginInput) {
    const admin = await adminUserRepo.findByEmail(input.email);
    if (!admin || !admin.isActive) {
      throw new UnauthorizedError("Invalid email or password");
    }
    const valid = await bcrypt.compare(input.password, admin.passwordHash);
    if (!valid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const claims = { sub: admin.id, type: "ADMIN" as const, role: admin.role };
    const accessToken = signAccessToken(claims);
    const refreshToken = signRefreshToken(claims);
    await refreshTokenRepo.create({
      adminId: admin.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: futureDateFromDuration(env.JWT_REFRESH_TTL),
    });

    return {
      accessToken,
      refreshToken,
      admin: { id: admin.id, email: admin.email, fullName: admin.fullName, role: admin.role },
    };
  };
}
