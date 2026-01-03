-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "usedAt" DATETIME,
    "businessId" TEXT NOT NULL,
    CONSTRAINT "PasswordResetToken_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "passwordHash" TEXT NOT NULL,
    "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
    "lockUntil" DATETIME
);
INSERT INTO "new_Business" ("category", "city", "country", "createdAt", "id", "name", "ownerEmail", "passwordHash", "slug", "updatedAt", "website") SELECT "category", "city", "country", "createdAt", "id", "name", "ownerEmail", "passwordHash", "slug", "updatedAt", "website" FROM "Business";
DROP TABLE "Business";
ALTER TABLE "new_Business" RENAME TO "Business";
CREATE UNIQUE INDEX "Business_slug_key" ON "Business"("slug");
CREATE UNIQUE INDEX "Business_ownerEmail_key" ON "Business"("ownerEmail");
CREATE INDEX "Business_category_idx" ON "Business"("category");
CREATE INDEX "Business_city_idx" ON "Business"("city");
CREATE INDEX "Business_country_idx" ON "Business"("country");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_businessId_idx" ON "PasswordResetToken"("businessId");

-- CreateIndex
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");
