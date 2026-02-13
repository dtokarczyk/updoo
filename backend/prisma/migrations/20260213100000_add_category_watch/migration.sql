-- CreateTable
CREATE TABLE "CategoryWatch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CategoryWatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CategoryWatch_userId_categoryId_key" ON "CategoryWatch"("userId", "categoryId");

-- CreateIndex
CREATE INDEX "CategoryWatch_userId_idx" ON "CategoryWatch"("userId");

-- CreateIndex
CREATE INDEX "CategoryWatch_categoryId_idx" ON "CategoryWatch"("categoryId");

-- AddForeignKey
ALTER TABLE "CategoryWatch" ADD CONSTRAINT "CategoryWatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryWatch" ADD CONSTRAINT "CategoryWatch_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
