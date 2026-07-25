import type { Redis } from "ioredis";
import type { Store, IncrementResponse } from "express-rate-limit";
import { logger } from "../../../config/logger";

/**
 * Minimal fixed-window Store for express-rate-limit backed by Redis, so
 * limits are enforced across every API instance instead of reset per-process
 * (the default MemoryStore's failure mode at >1 instance). Written by hand
 * rather than pulling in a package: it's ~20 lines against a client already
 * in the dependency tree (ioredis), and express-rate-limit's Store contract
 * is small enough that a bespoke implementation is less risk than a new
 * third-party dependency for this.
 *
 * Fails open (allows the request) on a Redis error rather than blocking the
 * whole API on a rate-limiter infrastructure outage — see the comment on
 * increment() below.
 */
export class RedisRateLimitStore implements Store {
  private windowMs = 60_000;

  // Not private: the Store interface itself declares an optional `prefix`
  // property (used by express-rate-limit's double-count detection), so this
  // has to be publicly visible to structurally satisfy that type.
  constructor(
    private readonly redis: Redis,
    public readonly prefix: string,
  ) {}

  init(options: { windowMs: number }): void {
    this.windowMs = options.windowMs;
  }

  private key(key: string): string {
    return `${this.prefix}${key}`;
  }

  async increment(key: string): Promise<IncrementResponse> {
    const redisKey = this.key(key);
    try {
      const totalHits = await this.redis.incr(redisKey);
      if (totalHits === 1) {
        await this.redis.pexpire(redisKey, this.windowMs);
      }
      const ttl = await this.redis.pttl(redisKey);
      const resetTime = new Date(Date.now() + (ttl > 0 ? ttl : this.windowMs));
      return { totalHits, resetTime };
    } catch (err) {
      logger.error({ err, redisKey }, "Rate limiter Redis store failed; failing open for this request");
      return { totalHits: 1, resetTime: new Date(Date.now() + this.windowMs) };
    }
  }

  async decrement(key: string): Promise<void> {
    try {
      await this.redis.decr(this.key(key));
    } catch {
      // Best-effort — a missed decrement just makes the window slightly
      // stricter than intended, which is the safe direction to fail in.
    }
  }

  async resetKey(key: string): Promise<void> {
    try {
      await this.redis.del(this.key(key));
    } catch {
      // ignored — see decrement()
    }
  }
}
