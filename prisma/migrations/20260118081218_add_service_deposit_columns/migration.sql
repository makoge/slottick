-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "depositEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "depositType" TEXT NOT NULL DEFAULT 'PERCENT',
ADD COLUMN     "depositValue" INTEGER;
