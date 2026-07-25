import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../../../infrastructure/auth/jwt";
import { UnauthorizedError } from "../../../domain/errors/DomainError";
import "../types";

/** Requires a valid bearer access token (player OR admin); attaches req.auth. */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next(new UnauthorizedError("Missing bearer token"));
    return;
  }
  try {
    req.auth = verifyAccessToken(header.slice("Bearer ".length));
    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired token"));
  }
}

/** Parses a bearer token if present, but never rejects the request when it's missing or invalid — used on routes that are public but show more to an authenticated admin (e.g. tournament listing including drafts). */
export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try {
      req.auth = verifyAccessToken(header.slice("Bearer ".length));
    } catch {
      // ignored — treated as anonymous
    }
  }
  next();
}

/** Narrows authenticate() to only player-scoped tokens. */
export function requirePlayer(req: Request, _res: Response, next: NextFunction): void {
  if (req.auth?.type !== "PLAYER") {
    next(new UnauthorizedError("A player session is required"));
    return;
  }
  next();
}

/** Narrows authenticate() to only admin-scoped tokens. */
export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (req.auth?.type !== "ADMIN") {
    next(new UnauthorizedError("An admin session is required"));
    return;
  }
  next();
}
