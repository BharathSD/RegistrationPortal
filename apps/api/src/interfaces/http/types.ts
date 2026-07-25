import type { AccessTokenClaims } from "../../infrastructure/auth/jwt";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AccessTokenClaims;
      /** Raw request body bytes, captured by express.json()'s verify hook in app.ts — needed for webhook HMAC signature checks, which must run over the exact bytes sent, not the re-serialized parsed object. */
      rawBody?: Buffer;
    }
  }
}

export {};
