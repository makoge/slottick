/*
  Warnings:

  - You are about to drop the column `date` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `time` on the `Booking` table. All the data in the column will be lost.
  - Added the required column `startsAt` to the `Booking` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Business" ADD COLUMN "marketplaceEligibleAt" DATETIME;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "businessId" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "startsAt" DATETIME NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerEmail" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "cancelledAt" DATETIME,
    "reviewEmailSentAt" DATETIME,
    CONSTRAINT "Booking_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Booking" ("businessId", "createdAt", "currency", "customerEmail", "customerName", "customerPhone", "durationMin", "id", "notes", "price", "serviceName", "updatedAt") SELECT "businessId", "createdAt", "currency", "customerEmail", "customerName", "customerPhone", "durationMin", "id", "notes", "price", "serviceName", "updatedAt" FROM "Booking";
DROP TABLE "Booking";
ALTER TABLE "new_Booking" RENAME TO "Booking";
CREATE INDEX "Booking_businessId_startsAt_idx" ON "Booking"("businessId", "startsAt");
CREATE UNIQUE INDEX "Booking_businessId_startsAt_key" ON "Booking"("businessId", "startsAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
