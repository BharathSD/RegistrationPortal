import crypto from "node:crypto";

/** Refresh tokens are stored hashed (never plaintext) so a DB leak doesn't hand out live sessions. */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
