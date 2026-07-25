/*
  Warnings:

  - Made the column `pincode` on table `players` required. This step will fail if there are existing NULL values in that column.

*/
-- Backfill any pre-existing NULL pincodes (dev/seed data only — no
-- production rows exist yet) before enforcing NOT NULL.
UPDATE "players" SET "pincode" = '000000' WHERE "pincode" IS NULL;

-- AlterTable
ALTER TABLE "players" ALTER COLUMN "pincode" SET NOT NULL;
