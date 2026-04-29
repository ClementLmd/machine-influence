/*
  Warnings:

  - Made the column `location` on table `Announcement` required. This step will fail if there are existing NULL values in that column.

*/
-- Update existing NULL values with a default value before making the column required
UPDATE "Announcement" SET "location" = 'Non précisé' WHERE "location" IS NULL;

-- AlterTable
ALTER TABLE "Announcement" ALTER COLUMN "location" SET NOT NULL;
