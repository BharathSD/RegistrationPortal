import Redis from "ioredis";
import { env } from "../../config/env";
import { logger } from "../../config/logger";

declare global {
  var __redis: Redis | undefined;
}

/**
 * Singleton, same rationale as infrastructure/prisma/client.ts. Used by the
 * rate limiter (see middleware/rateLimiter.ts) so limits are shared across
 * every API instance instead of reset per-process — with
 * express-rate-limit's default in-memory store, running N instances behind
 * a load balancer silently multiplies every limit by N.
 */
export const redis =
  global.__redis ??
  new Redis(env.REDIS_URL, {
    // Don't buffer commands indefinitely if Redis is unreachable — the rate
    // limiter store is written to fail open (allow the request) rather than
    // block the whole API on a Redis outage, so commands should fail fast.
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    lazyConnect: true,
  });

redis.on("error", (err) => {
  logger.error({ err }, "Redis connection error");
});

if (env.NODE_ENV !== "production") {
  global.__redis = redis;
}
