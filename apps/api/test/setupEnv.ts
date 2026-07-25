/**
 * Loaded via vitest.config.ts `setupFiles` before any test file is imported,
 * so `src/config/env.ts`'s Zod validation always sees a complete, valid
 * environment — unit tests never touch a real database or secret store.
 *
 * Loads apps/api/.env first (so integration tests pick up whatever real
 * DATABASE_URL/REDIS_URL local dev is already using) and only falls back to
 * placeholders for anything still unset — e.g. in CI, where secrets come
 * from the workflow env instead of a checked-in .env file.
 */
import { config } from "dotenv";
import path from "node:path";

config({ path: path.resolve(__dirname, "../.env") });

process.env.NODE_ENV = "test";
process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/cricket_platform_test?schema=public";
process.env.JWT_ACCESS_SECRET ??= "test-access-secret-please-change-0123456789";
process.env.JWT_REFRESH_SECRET ??= "test-refresh-secret-please-change-0123456789";
