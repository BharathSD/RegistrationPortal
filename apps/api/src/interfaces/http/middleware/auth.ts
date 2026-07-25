import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../../../infrastructure/auth/jwt";
import { UnauthorizedError } from "../../../domain/errors/DomainError";
import { isPendingSubject } from "../../../application/auth/otp.util";
import type { PlayerRepository } from "../../../domain/repositories/PlayerRepository";
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

/**
 * Rejects a valid, unexpired access token belonging to a player who was
 * soft-deleted (or otherwise no longer exists) after the token was issued.
 * A JWT's signature/expiry alone can't express "this account was deleted
 * five minutes ago" — the token stays cryptographically valid for its full
 * TTL regardless. This adds one indexed lookup per request on player
 * routes, which is the trade-off for closing that gap; combined with
 * revoking refresh tokens on delete (see DeletePlayerUseCase), a deleted
 * player's access is cut off at most one access-token TTL after deletion
 * instead of up to a full refresh-token TTL.
 *
 * Skipped for pending subjects (`pending:<mobile>`), which by definition
 * have no player row yet — e.g. the in-progress /players/register call.
 */
export function makeRequireActivePlayer(playerRepo: PlayerRepository) {
  return async function requireActivePlayer(req: Request, _res: Response, next: NextFunction): Promise<void> {
    const sub = req.auth?.sub;
    if (req.auth?.type !== "PLAYER" || !sub || isPendingSubject(sub)) {
      next();
      return;
    }
    try {
      const player = await playerRepo.findById(sub);
      if (!player) {
        next(new UnauthorizedError("This account is no longer active"));
        return;
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
