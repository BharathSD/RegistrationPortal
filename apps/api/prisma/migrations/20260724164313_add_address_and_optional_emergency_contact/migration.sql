/*
  Warnings:

  - Added the required column `address_line1` to the `players` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
-- address_line1 is backfilled with an empty string for any pre-existing
-- rows (none in production yet — this only matters for seeded/dev data),
-- then left NOT NULL with no default so every future insert must supply it.
ALTER TABLE "players" ADD COLUMN     "address_line1" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "address_line2" TEXT,
ALTER COLUMN "emergency_contact_name" DROP NOT NULL,
ALTER COLUMN "emergency_contact_relation" DROP NOT NULL,
ALTER COLUMN "emergency_contact_phone" DROP NOT NULL;

ALTER TABLE "players" ALTER COLUMN "address_line1" DROP DEFAULT;
