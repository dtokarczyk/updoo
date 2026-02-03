-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "status" "ListingStatus" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Listing_status_idx" ON "Listing"("status");
