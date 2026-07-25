-- Merge SUPER_ADMIN + TOURNAMENT_ADMIN into a single ADMIN role.
--
-- Every route in this app that checked for SUPER_ADMIN also checked for
-- TOURNAMENT_ADMIN in the same breath — there was no endpoint SUPER_ADMIN
-- could reach that TOURNAMENT_ADMIN couldn't. The distinction was in the
-- schema but never actually enforced anywhere, so it's collapsed here.
-- SCANNER is untouched: it's the one role that's genuinely restricted
-- (check-in only), so it stays separate.
--
-- Postgres has no direct "remove enum value" — the safe pattern is:
-- rename one surviving value in place, move any rows off the value being
-- retired, then swap in a freshly-created enum type without it.

-- 1. Reuse the TOURNAMENT_ADMIN slot as the new unified ADMIN value.
ALTER TYPE "AdminRole" RENAME VALUE 'TOURNAMENT_ADMIN' TO 'ADMIN';

-- 2. Move any existing SUPER_ADMIN rows onto it.
UPDATE "admin_users" SET "role" = 'ADMIN' WHERE "role" = 'SUPER_ADMIN';

-- 3. Rebuild the enum type without SUPER_ADMIN.
CREATE TYPE "AdminRole_new" AS ENUM ('ADMIN', 'SCANNER');
ALTER TABLE "admin_users" ALTER COLUMN "role" TYPE "AdminRole_new" USING ("role"::text::"AdminRole_new");
DROP TYPE "AdminRole";
ALTER TYPE "AdminRole_new" RENAME TO "AdminRole";
