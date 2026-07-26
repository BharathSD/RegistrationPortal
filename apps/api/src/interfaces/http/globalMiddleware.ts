import path from "node:path";
import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import pinoHttp from "pino-http";

import { env } from "../../config/env";
import { logger } from "../../config/logger";
import { requestId } from "./middleware/requestId";
import { globalRateLimiter } from "./middleware/rateLimiter";

/** Parses the comma-separated ALLOWED_ORIGINS env var into the array form cors() expects. */
function parseAllowedOrigins(value: string | undefined): string[] {
  const origins = (value ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  if (origins.length === 0) {
    throw new Error(
      "ALLOWED_ORIGINS must be set to a comma-separated list of allowed origins in production (e.g. https://app.example.com).",
    );
  }
  return origins;
}

/** Global middleware stack: request id, logging, security headers, CORS, body parsing, rate limiting, and the public /uploads static mount. */
export function applyGlobalMiddleware(app: Express): void {
  app.use(requestId);
  app.use(
    pinoHttp({
      logger,
      // Without this, pino-http mints its own request id independent of the
      // x-request-id header requestId() just set/propagated above, so the id
      // in structured logs would never match what's returned to the client —
      // defeating the point of having a correlation id at all.
      genReqId: (req) => req.headers["x-request-id"] as string,
      customLogLevel: (_req, res) => (res.statusCode >= 500 ? "error" : "info"),
    }),
  );
  app.use(helmet());
  app.use(
    cors({
      // In production this must be an explicit allowlist, not `true`
      // (reflects every origin) and not `undefined` — passing `undefined`
      // overwrites the cors package's own default and results in NO
      // Access-Control-Allow-Origin header being sent at all, silently
      // blocking the production frontend on every cross-origin request.
      origin: env.NODE_ENV === "production" ? parseAllowedOrigins(env.ALLOWED_ORIGINS) : true,
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(
    express.json({
      limit: "1mb",
      // Stashes the exact bytes received so the payments webhook can verify
      // its HMAC signature over the raw body — re-serializing req.body would
      // produce different bytes than what Razorpay actually signed. See
      // controllers/payments.controller.ts.
      verify: (req, _res, buf) => {
        (req as express.Request).rawBody = buf;
      },
    }),
  );
  app.use(globalRateLimiter);
  // helmet()'s default Cross-Origin-Resource-Policy: same-origin blocks the
  // web app (a different origin/port in dev, and typically a separate
  // subdomain in prod) from ever rendering an <img> pointed at these files —
  // that's the exact "photo doesn't show up after registration" symptom.
  // Uploaded photos are public-read profile pictures, not sensitive, so
  // cross-origin embedding is safe to allow for this path only.
  app.use("/uploads", (_req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  });
  app.use("/uploads", express.static(path.resolve(env.UPLOAD_DIR)));
}
