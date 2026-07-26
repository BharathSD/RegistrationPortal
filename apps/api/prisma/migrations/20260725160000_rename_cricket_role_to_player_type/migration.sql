-- Rename the CricketRole enum and its column to PlayerType / player_type.
--
-- No value change (still SUPER_STRIKER, ALL_ROUNDER, BATSMAN, BOWLER) — this
-- is a naming-only fix. The field is an admin-assigned tournament tier, not
-- the player's intrinsic cricket-playing position (that's battingStyle /
-- bowlingStyle), and the old name conflated the two. A pure rename, so no
-- data migration is needed.

ALTER TYPE "CricketRole" RENAME TO "PlayerType";
ALTER TABLE "players" RENAME COLUMN "cricket_role" TO "player_type";
