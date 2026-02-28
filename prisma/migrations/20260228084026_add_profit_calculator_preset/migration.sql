-- CreateTable
CREATE TABLE "rag_chunks" (
    "id" BIGSERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "embedding" vector NOT NULL,

    CONSTRAINT "rag_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfitCalculatorPreset" (
    "businessId" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "minutes" INTEGER NOT NULL DEFAULT 60,
    "feePct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fixedMonthly" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "apptsPerMonth" INTEGER NOT NULL DEFAULT 0,
    "targetHourly" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "productsJson" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfitCalculatorPreset_pkey" PRIMARY KEY ("businessId")
);

-- CreateIndex
CREATE INDEX "rag_chunks_embedding_idx" ON "rag_chunks"("embedding");

-- AddForeignKey
ALTER TABLE "ProfitCalculatorPreset" ADD CONSTRAINT "ProfitCalculatorPreset_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
