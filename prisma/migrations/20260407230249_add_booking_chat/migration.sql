-- CreateEnum
CREATE TYPE "MessageSenderType" AS ENUM ('BUSINESS', 'CUSTOMER', 'SYSTEM');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BookingStatus" ADD VALUE 'PENDING';
ALTER TYPE "BookingStatus" ADD VALUE 'NEEDS_INFO';
ALTER TYPE "BookingStatus" ADD VALUE 'DECLINED';

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "respondedAt" TIMESTAMP(3),
ADD COLUMN     "statusUpdatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "bookingApprovalRequired" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "BookingConversation" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "customerId" TEXT,
    "clientTokenHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastMessageAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "BookingConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderType" "MessageSenderType" NOT NULL,
    "businessId" TEXT,
    "customerId" TEXT,
    "body" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "bookingId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BookingConversation_bookingId_key" ON "BookingConversation"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingConversation_clientTokenHash_key" ON "BookingConversation"("clientTokenHash");

-- CreateIndex
CREATE INDEX "BookingConversation_businessId_updatedAt_idx" ON "BookingConversation"("businessId", "updatedAt");

-- CreateIndex
CREATE INDEX "BookingConversation_customerId_idx" ON "BookingConversation"("customerId");

-- CreateIndex
CREATE INDEX "BookingMessage_conversationId_createdAt_idx" ON "BookingMessage"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "BookingMessage_isRead_idx" ON "BookingMessage"("isRead");

-- CreateIndex
CREATE INDEX "BookingMessage_businessId_idx" ON "BookingMessage"("businessId");

-- CreateIndex
CREATE INDEX "BookingMessage_customerId_idx" ON "BookingMessage"("customerId");

-- CreateIndex
CREATE INDEX "Notification_businessId_isRead_createdAt_idx" ON "Notification"("businessId", "isRead", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_bookingId_idx" ON "Notification"("bookingId");

-- AddForeignKey
ALTER TABLE "BookingConversation" ADD CONSTRAINT "BookingConversation_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingConversation" ADD CONSTRAINT "BookingConversation_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingConversation" ADD CONSTRAINT "BookingConversation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingMessage" ADD CONSTRAINT "BookingMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "BookingConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingMessage" ADD CONSTRAINT "BookingMessage_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingMessage" ADD CONSTRAINT "BookingMessage_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
