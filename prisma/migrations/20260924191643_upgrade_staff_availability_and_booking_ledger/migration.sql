/*
  Warnings:

  - You are about to drop the column `clientToken` on the `BookingConversation` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[staffId,startsAt]` on the table `Booking` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `endsAt` to the `Booking` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'DEPOSIT_PAID', 'FULLY_PAID', 'REFUNDED');

-- DropIndex
DROP INDEX "AvailabilityRule_businessId_key";

-- DropIndex
DROP INDEX "Booking_businessId_serviceCategory_idx";

-- DropIndex
DROP INDEX "Booking_businessId_serviceId_idx";

-- DropIndex
DROP INDEX "Booking_businessId_startsAt_idx";

-- DropIndex
DROP INDEX "Booking_businessId_startsAt_key";

-- DropIndex
DROP INDEX "BookingConversation_clientToken_key";

-- AlterTable
ALTER TABLE "AvailabilityRule" ADD COLUMN     "staffId" TEXT,
ALTER COLUMN "timezone" SET DEFAULT 'UTC',
ALTER COLUMN "bufferMin" SET DEFAULT 0,
ALTER COLUMN "slotStepMin" SET DEFAULT 15;

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "customerId" TEXT,
ADD COLUMN     "depositAmount" INTEGER,
ADD COLUMN     "depositPaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "depositPaymentRef" TEXT,
ADD COLUMN     "endsAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
ADD COLUMN     "staffId" TEXT;

-- AlterTable
ALTER TABLE "BookingConversation" DROP COLUMN "clientToken";

-- AlterTable
ALTER TABLE "Service" ALTER COLUMN "currency" SET DEFAULT 'EUR';

-- CreateTable
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "avatarUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffTimeOff" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "businessId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,

    CONSTRAINT "StaffTimeOff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingItem" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,

    CONSTRAINT "BookingItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlotHold" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "staffId" TEXT,
    "sessionId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SlotHold_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessCustomerProfile" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT NOT NULL,
    "customerId" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "notes" TEXT,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "noShowCount" INTEGER NOT NULL DEFAULT 0,
    "totalVisits" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BusinessCustomerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ServiceToStaff" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ServiceToStaff_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "Staff_businessId_idx" ON "Staff"("businessId");

-- CreateIndex
CREATE INDEX "Staff_isActive_idx" ON "Staff"("isActive");

-- CreateIndex
CREATE INDEX "StaffTimeOff_businessId_startsAt_idx" ON "StaffTimeOff"("businessId", "startsAt");

-- CreateIndex
CREATE INDEX "StaffTimeOff_staffId_startsAt_endsAt_idx" ON "StaffTimeOff"("staffId", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "BookingItem_bookingId_idx" ON "BookingItem"("bookingId");

-- CreateIndex
CREATE INDEX "BookingItem_serviceId_idx" ON "BookingItem"("serviceId");

-- CreateIndex
CREATE INDEX "SlotHold_businessId_startsAt_endsAt_idx" ON "SlotHold"("businessId", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "SlotHold_staffId_startsAt_endsAt_idx" ON "SlotHold"("staffId", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "SlotHold_expiresAt_idx" ON "SlotHold"("expiresAt");

-- CreateIndex
CREATE INDEX "BusinessCustomerProfile_businessId_idx" ON "BusinessCustomerProfile"("businessId");

-- CreateIndex
CREATE INDEX "BusinessCustomerProfile_customerId_idx" ON "BusinessCustomerProfile"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessCustomerProfile_businessId_phone_key" ON "BusinessCustomerProfile"("businessId", "phone");

-- CreateIndex
CREATE INDEX "_ServiceToStaff_B_index" ON "_ServiceToStaff"("B");

-- CreateIndex
CREATE INDEX "AvailabilityRule_staffId_idx" ON "AvailabilityRule"("staffId");

-- CreateIndex
CREATE INDEX "Booking_businessId_startsAt_endsAt_idx" ON "Booking"("businessId", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "Booking_staffId_startsAt_endsAt_idx" ON "Booking"("staffId", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "Booking_businessId_status_idx" ON "Booking"("businessId", "status");

-- CreateIndex
CREATE INDEX "Booking_customerId_idx" ON "Booking"("customerId");

-- CreateIndex
CREATE INDEX "Booking_customerPhone_idx" ON "Booking"("customerPhone");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_staffId_startsAt_key" ON "Booking"("staffId", "startsAt");

-- CreateIndex
CREATE INDEX "CustomerSession_expiresAt_idx" ON "CustomerSession"("expiresAt");

-- CreateIndex
CREATE INDEX "ServiceImage_serviceId_sort_idx" ON "ServiceImage"("serviceId", "sort");

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityRule" ADD CONSTRAINT "AvailabilityRule_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffTimeOff" ADD CONSTRAINT "StaffTimeOff_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffTimeOff" ADD CONSTRAINT "StaffTimeOff_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingItem" ADD CONSTRAINT "BookingItem_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingItem" ADD CONSTRAINT "BookingItem_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlotHold" ADD CONSTRAINT "SlotHold_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlotHold" ADD CONSTRAINT "SlotHold_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessCustomerProfile" ADD CONSTRAINT "BusinessCustomerProfile_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessCustomerProfile" ADD CONSTRAINT "BusinessCustomerProfile_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServiceToStaff" ADD CONSTRAINT "_ServiceToStaff_A_fkey" FOREIGN KEY ("A") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServiceToStaff" ADD CONSTRAINT "_ServiceToStaff_B_fkey" FOREIGN KEY ("B") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
