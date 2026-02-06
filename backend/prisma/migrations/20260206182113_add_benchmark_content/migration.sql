-- CreateTable
CREATE TABLE "BenchmarkContent" (
    "id" TEXT NOT NULL,
    "file" TEXT NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "BenchmarkContent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BenchmarkContent_file_key" ON "BenchmarkContent"("file");
