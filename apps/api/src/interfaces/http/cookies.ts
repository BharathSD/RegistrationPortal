import { parse } from "cookie";
import type { Request, Response } from "express";
import { env } from "../../config/env";
import { futureDateFromDuration } from "../../infrastructure/auth/duration";

export const REFRESH_COOKIE_NAME = "refreshToken";

/**
 * The refresh token lives only here — an httpOnly cookie the client never
 * reads or stores itself — instead of in the JSON response body / localStorage.
 * Scoped to the auth routes' own path so it isn't attached to every request
 * (it's only needed by /token/refresh and /logout).
 *
 * SameSite=Lax rather than Strict: a refresh call is a fetch/XHR, not a
 * top-level navigation, so Strict would never send it on first load after
 * following a link from elsewhere. Lax still withholds the cookie on
 * genuinely cross-site requests, which is what matters here.
 */
export function setRefreshTokenCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/v1/auth",
    expires: futureDateFromDuration(env.JWT_REFRESH_TTL),
  });
}

export function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/v1/auth",
  });
}

/**
 * Manual parse of the Cookie header rather than the global cookie-parser
 * middleware — only this one route needs it, so there's no reason to parse
 * cookies on every request in the app.
 */
export function readRefreshTokenCookie(req: Request): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  return parse(header)[REFRESH_COOKIE_NAME];
}
