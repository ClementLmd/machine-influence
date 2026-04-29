/*
  Warnings:

  - The values [INDEPENDENT] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum with data migration: map INDEPENDENT to CANDIDATE
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('RECRUITER', 'CANDIDATE');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" 
  USING (
    CASE "role"::text
      WHEN 'INDEPENDENT' THEN 'CANDIDATE'::"UserRole_new"
      ELSE "role"::text::"UserRole_new"
    END
  );
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";
COMMIT;

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "recruiterId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "productionType" TEXT NOT NULL,
    "location" TEXT,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Announcement_recruiterId_idx" ON "Announcement"("recruiterId");

-- CreateIndex
CREATE INDEX "Announcement_createdAt_idx" ON "Announcement"("createdAt");

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
