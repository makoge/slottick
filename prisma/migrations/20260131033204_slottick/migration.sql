/*
  Warnings:

  - You are about to drop the column `category` on the `Business` table. All the data in the column will be lost.
  - Added the required column `industry` to the `Business` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Industry" AS ENUM ('BEAUTY_AND_CARE', 'WELLNESS_AND_LIFESTYLE', 'CREATIVE_SERVICES', 'HOME_AND_LOCAL', 'EDUCATION_AND_PROFESSIONALS');

-- DropIndex
DROP INDEX "Business_category_idx";

-- DropIndex
DROP INDEX "EmailVerificationToken_expiresAt_idx";

-- AlterTable
ALTER TABLE "Business" DROP COLUMN "category",
ADD COLUMN     "industry" "Industry" NOT NULL,
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "street" TEXT;

-- CreateIndex
CREATE INDEX "Business_industry_idx" ON "Business"("industry");
