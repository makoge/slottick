/*
  Warnings:

  - A unique constraint covering the columns `[businessId]` on the table `AvailabilityRule` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `ownerEmail` to the `Business` table without a default value. This is not possible if the table is not empty.
  - Added the required column `passwordHash` to the `Business` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Business" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "website" TEXT,
    "ownerEmail" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL
);
INSERT INTO "new_Business" ("category", "city", "country", "createdAt", "id", "name", "slug", "website") SELECT "category", "city", "country", "createdAt", "id", "name", "slug", "website" FROM "Business";
DROP TABLE "Business";
ALTER TABLE "new_Business" RENAME TO "Business";
CREATE UNIQUE INDEX "Business_slug_key" ON "Business"("slug");
CREATE UNIQUE INDEX "Business_ownerEmail_key" ON "Business"("ownerEmail");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "AvailabilityRule_businessId_key" ON "AvailabilityRule"("businessId");
