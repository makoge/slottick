/*
  Warnings:

  - Added the required column `updatedAt` to the `AvailabilityRule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Business` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Service` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    CONSTRAINT "Session_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AvailabilityRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "businessId" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "daysJson" TEXT NOT NULL,
    "start" TEXT NOT NULL,
    "end" TEXT NOT NULL,
    "breakStart" TEXT,
    "breakEnd" TEXT,
    "bufferMin" INTEGER NOT NULL,
    "slotStepMin" INTEGER NOT NULL,
    CONSTRAINT "AvailabilityRule_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AvailabilityRule" ("breakEnd", "breakStart", "bufferMin", "businessId", "createdAt", "daysJson", "end", "id", "slotStepMin", "start", "timezone") SELECT "breakEnd", "breakStart", "bufferMin", "businessId", "createdAt", "daysJson", "end", "id", "slotStepMin", "start", "timezone" FROM "AvailabilityRule";
DROP TABLE "AvailabilityRule";
ALTER TABLE "new_AvailabilityRule" RENAME TO "AvailabilityRule";
CREATE UNIQUE INDEX "AvailabilityRule_businessId_key" ON "AvailabilityRule"("businessId");
CREATE INDEX "AvailabilityRule_businessId_idx" ON "AvailabilityRule"("businessId");
CREATE TABLE "new_Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "businessId" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "notes" TEXT,
    CONSTRAINT "Booking_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Booking" ("businessId", "createdAt", "currency", "customerName", "customerPhone", "date", "durationMin", "id", "notes", "price", "serviceName", "time") SELECT "businessId", "createdAt", "currency", "customerName", "customerPhone", "date", "durationMin", "id", "notes", "price", "serviceName", "time" FROM "Booking";
DROP TABLE "Booking";
ALTER TABLE "new_Booking" RENAME TO "Booking";
CREATE INDEX "Booking_businessId_idx" ON "Booking"("businessId");
CREATE INDEX "Booking_date_idx" ON "Booking"("date");
CREATE UNIQUE INDEX "Booking_businessId_date_time_key" ON "Booking"("businessId", "date", "time");
CREATE TABLE "new_Business" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "website" TEXT,
    "ownerEmail" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL
);
INSERT INTO "new_Business" ("category", "city", "country", "createdAt", "id", "name", "ownerEmail", "passwordHash", "slug", "website") SELECT "category", "city", "country", "createdAt", "id", "name", "ownerEmail", "passwordHash", "slug", "website" FROM "Business";
DROP TABLE "Business";
ALTER TABLE "new_Business" RENAME TO "Business";
CREATE UNIQUE INDEX "Business_slug_key" ON "Business"("slug");
CREATE UNIQUE INDEX "Business_ownerEmail_key" ON "Business"("ownerEmail");
CREATE INDEX "Business_category_idx" ON "Business"("category");
CREATE INDEX "Business_city_idx" ON "Business"("city");
CREATE INDEX "Business_country_idx" ON "Business"("country");
CREATE TABLE "new_Service" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    CONSTRAINT "Service_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Service" ("businessId", "createdAt", "currency", "durationMin", "id", "name", "price") SELECT "businessId", "createdAt", "currency", "durationMin", "id", "name", "price" FROM "Service";
DROP TABLE "Service";
ALTER TABLE "new_Service" RENAME TO "Service";
CREATE INDEX "Service_businessId_idx" ON "Service"("businessId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_businessId_idx" ON "Session"("businessId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE INDEX "Review_businessId_idx" ON "Review"("businessId");
