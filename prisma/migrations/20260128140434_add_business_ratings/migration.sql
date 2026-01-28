-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "heroTag" TEXT,
ADD COLUMN     "ratingAvg" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "ratingCount" INTEGER DEFAULT 0;
