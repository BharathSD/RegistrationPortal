-- Replace the cricket-role categories with the tournament's actual player
-- tiers: Super Striker, All-Rounder, Batsman, Bowler.
--
-- Wicket-Keeper is retired — there's no equivalent in the new scheme, so
-- any player currently marked WICKET_KEEPER is reset to unassigned
-- (cricket_role = NULL) for an admin to re-categorize. Batter is renamed
-- to Batsman (same meaning); Bowler and All-Rounder carry over unchanged.
--
-- Same "recreate the enum type" pattern used for the AdminRole merge:
-- Postgres has no direct "remove enum value".

UPDATE "players" SET "cricket_role" = NULL WHERE "cricket_role" = 'WICKET_KEEPER';

CREATE TYPE "CricketRole_new" AS ENUM ('SUPER_STRIKER', 'ALL_ROUNDER', 'BATSMAN', 'BOWLER');

ALTER TABLE "players"
  ALTER COLUMN "cricket_role" TYPE "CricketRole_new"
  USING (
    CASE "cricket_role"::text
      WHEN 'BATTER' THEN 'BATSMAN'
      ELSE "cricket_role"::text
    END
  )::"CricketRole_new";

DROP TYPE "CricketRole";
ALTER TYPE "CricketRole_new" RENAME TO "CricketRole";
