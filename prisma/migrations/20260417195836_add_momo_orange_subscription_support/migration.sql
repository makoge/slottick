/*
  Warnings:

  - The `subscriptionStatus` column on the `Business` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "MobileNetwork" AS ENUM ('MTN', 'ORANGE');

-- CreateEnum
CREATE TYPE "MobileMoneyProvider" AS ENUM ('MTN_MOMO', 'ORANGE_MONEY');

-- CreateEnum
CREATE TYPE "MomoSubscriptionStatus" AS ENUM ('ACTIVE', 'PENDING_PAYMENT', 'PAST_DUE', 'CANCELED');

-- CreateEnum
CREATE TYPE "MomoPaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'EXPIRED', 'CANCELED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'FAILED', 'CANCELED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "BillingProvider" AS ENUM ('STRIPE', 'MTN_MOMO', 'ORANGE_MONEY');

-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "billingProvider" "BillingProvider",
ADD COLUMN     "momoLastPaidAt" TIMESTAMP(3),
ADD COLUMN     "momoNetwork" "MobileNetwork",
ADD COLUMN     "momoNextBillingDate" TIMESTAMP(3),
ADD COLUMN     "momoPhone" TEXT,
ADD COLUMN     "momoPlanCode" TEXT,
ADD COLUMN     "momoProviderRef" TEXT,
ADD COLUMN     "momoSubscriptionStatus" "MomoSubscriptionStatus",
DROP COLUMN "subscriptionStatus",
ADD COLUMN     "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'TRIALING';

-- CreateTable
CREATE TABLE "MomoPaymentAttempt" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT NOT NULL,
    "provider" "MobileMoneyProvider" NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "network" "MobileNetwork" NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'XAF',
    "billingForMonth" TEXT,
    "externalReference" TEXT NOT NULL,
    "providerTxnId" TEXT,
    "status" "MomoPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "initiatedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "failureCode" TEXT,
    "failureReason" TEXT,
    "rawResponseJson" TEXT,

    CONSTRAINT "MomoPaymentAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MomoWebhookEvent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "provider" "MobileMoneyProvider" NOT NULL,
    "eventType" TEXT,
    "eventId" TEXT,
    "reference" TEXT,
    "payloadJson" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'received',
    "errorMessage" TEXT,

    CONSTRAINT "MomoWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MomoPaymentAttempt_externalReference_key" ON "MomoPaymentAttempt"("externalReference");

-- CreateIndex
CREATE INDEX "MomoPaymentAttempt_businessId_createdAt_idx" ON "MomoPaymentAttempt"("businessId", "createdAt");

-- CreateIndex
CREATE INDEX "MomoPaymentAttempt_status_createdAt_idx" ON "MomoPaymentAttempt"("status", "createdAt");

-- CreateIndex
CREATE INDEX "MomoPaymentAttempt_provider_externalReference_idx" ON "MomoPaymentAttempt"("provider", "externalReference");

-- CreateIndex
CREATE INDEX "MomoWebhookEvent_provider_createdAt_idx" ON "MomoWebhookEvent"("provider", "createdAt");

-- CreateIndex
CREATE INDEX "MomoWebhookEvent_eventId_idx" ON "MomoWebhookEvent"("eventId");

-- CreateIndex
CREATE INDEX "MomoWebhookEvent_reference_idx" ON "MomoWebhookEvent"("reference");

-- AddForeignKey
ALTER TABLE "MomoPaymentAttempt" ADD CONSTRAINT "MomoPaymentAttempt_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
