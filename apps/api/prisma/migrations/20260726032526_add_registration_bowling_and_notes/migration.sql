-- AlterTable
ALTER TABLE "registrations" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "willing_to_bowl" BOOLEAN NOT NULL DEFAULT true;
