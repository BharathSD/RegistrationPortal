import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import type { OtpPurpose, AdminRole } from "@cricket-platform/shared";

export type AuthSubjectType = "PLAYER" | "ADMIN";

export interface AccessTokenClaims {
  /** player.id once a profile exists, otherwise `pending:<mobile>` for a REGISTRATION-purpose token; admin.id for ADMIN tokens. */
  sub: string;
  type: AuthSubjectType;
  mobile?: string;
  role?: AdminRole;
  purpose?: OtpPurpose;
}

export function signAccessToken(claims: AccessTokenClaims): string {
  return jwt.sign(claims, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_TTL as jwt.SignOptions["expiresIn"] });
}

export function verifyAccessToken(token: string): AccessTokenClaims {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenClaims;
}

export function signRefreshToken(claims: AccessTokenClaims): string {
  return jwt.sign(claims, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_TTL as jwt.SignOptions["expiresIn"] });
}

export function verifyRefreshToken(token: string): AccessTokenClaims {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as AccessTokenClaims;
}
