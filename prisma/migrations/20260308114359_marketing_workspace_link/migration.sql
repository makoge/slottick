/*
  Warnings:

  - A unique constraint covering the columns `[businessId]` on the table `MarketingWorkspace` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Automation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessId` to the `ScheduledMessage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Automation" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastRunAt" TIMESTAMP(3),
ADD COLUMN     "nextRunAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "MarketingWorkspace" ADD COLUMN     "businessId" TEXT;

-- AlterTable
ALTER TABLE "ScheduledMessage" ADD COLUMN     "automationId" TEXT,
ADD COLUMN     "businessId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Automation_isActive_nextRunAt_idx" ON "Automation"("isActive", "nextRunAt");

-- CreateIndex
CREATE UNIQUE INDEX "MarketingWorkspace_businessId_key" ON "MarketingWorkspace"("businessId");

-- CreateIndex
CREATE INDEX "ScheduledMessage_businessId_idx" ON "ScheduledMessage"("businessId");

-- AddForeignKey
ALTER TABLE "MarketingWorkspace" ADD CONSTRAINT "MarketingWorkspace_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledMessage" ADD CONSTRAINT "ScheduledMessage_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledMessage" ADD CONSTRAINT "ScheduledMessage_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "Automation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
