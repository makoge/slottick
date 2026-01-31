-- CreateTable
CREATE TABLE "BusinessImage" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BusinessImage_businessId_idx" ON "BusinessImage"("businessId");

-- CreateIndex
CREATE INDEX "BusinessImage_businessId_sort_idx" ON "BusinessImage"("businessId", "sort");

-- AddForeignKey
ALTER TABLE "BusinessImage" ADD CONSTRAINT "BusinessImage_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
