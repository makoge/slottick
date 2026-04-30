/*
  Warnings:

  - Added the required column `updatedAt` to the `Customer` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "authProvider" TEXT,
ADD COLUMN     "authProviderId" TEXT,
ADD COLUMN     "image" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "passwordHash" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Customer_authProvider_idx" ON "Customer"("authProvider");

-- CreateIndex
CREATE INDEX "Customer_authProviderId_idx" ON "Customer"("authProviderId");
