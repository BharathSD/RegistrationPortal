-- AlterTable
ALTER TABLE "players" ALTER COLUMN "cricket_role" DROP NOT NULL,
ALTER COLUMN "batting_style" DROP NOT NULL,
ALTER COLUMN "bowling_style" DROP NOT NULL,
ALTER COLUMN "bowling_style" DROP DEFAULT,
ALTER COLUMN "preferred_batting_position" DROP NOT NULL,
ALTER COLUMN "experience_level" DROP NOT NULL;
