-- AlterTable
ALTER TABLE "Job" ADD COLUMN "previewHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Job_previewHash_key" ON "Job"("previewHash");
