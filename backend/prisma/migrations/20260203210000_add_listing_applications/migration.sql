-- CreateTable
CREATE TABLE "ListingApplication" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "freelancerId" TEXT NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListingApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ListingApplication_listingId_freelancerId_key" ON "ListingApplication"("listingId", "freelancerId");

-- CreateIndex
CREATE INDEX "ListingApplication_listingId_idx" ON "ListingApplication"("listingId");

-- CreateIndex
CREATE INDEX "ListingApplication_freelancerId_idx" ON "ListingApplication"("freelancerId");

-- AddForeignKey
ALTER TABLE "ListingApplication" ADD CONSTRAINT "ListingApplication_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingApplication" ADD CONSTRAINT "ListingApplication_freelancerId_fkey" FOREIGN KEY ("freelancerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
