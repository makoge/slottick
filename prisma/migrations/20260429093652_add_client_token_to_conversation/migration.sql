/*
  Warnings:

  - A unique constraint covering the columns `[clientToken]` on the table `BookingConversation` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "BookingConversation" ADD COLUMN     "clientToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "BookingConversation_clientToken_key" ON "BookingConversation"("clientToken");
