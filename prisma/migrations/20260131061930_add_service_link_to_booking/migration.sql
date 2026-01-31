/*
  Warnings:

  - The `category` column on the `Service` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ServiceCategory" AS ENUM ('LASH', 'NAILS', 'BROWS', 'HAIR', 'BARBER', 'MASSAGE', 'MAKEUP', 'SKINCARE', 'TATTOO', 'FITNESS', 'OTHER');

-- DropIndex
DROP INDEX "Service_category_name_idx";

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "serviceCategory" "ServiceCategory",
ADD COLUMN     "serviceId" TEXT;

-- AlterTable
ALTER TABLE "Service" DROP COLUMN "category",
ADD COLUMN     "category" "ServiceCategory" NOT NULL DEFAULT 'OTHER';

-- CreateIndex
CREATE INDEX "Booking_businessId_serviceId_idx" ON "Booking"("businessId", "serviceId");

-- CreateIndex
CREATE INDEX "Booking_businessId_serviceCategory_idx" ON "Booking"("businessId", "serviceCategory");

-- CreateIndex
CREATE INDEX "EmailVerificationToken_expiresAt_idx" ON "EmailVerificationToken"("expiresAt");

-- CreateIndex
CREATE INDEX "Service_category_idx" ON "Service"("category");

-- CreateIndex
CREATE INDEX "Service_businessId_category_idx" ON "Service"("businessId", "category");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;
