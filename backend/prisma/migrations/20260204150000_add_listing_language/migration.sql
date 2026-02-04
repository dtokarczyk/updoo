-- CreateEnum
CREATE TYPE "ListingLanguage" AS ENUM ('ENGLISH', 'POLISH');

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN "language" "ListingLanguage" NOT NULL DEFAULT 'POLISH';

-- CreateIndex
CREATE INDEX "Listing_language_idx" ON "Listing"("language");
