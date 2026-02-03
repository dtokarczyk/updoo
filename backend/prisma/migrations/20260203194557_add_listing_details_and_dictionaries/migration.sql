-- CreateEnum
CREATE TYPE "BillingType" AS ENUM ('FIXED', 'HOURLY');

-- CreateEnum
CREATE TYPE "HoursPerWeek" AS ENUM ('LESS_THAN_10', 'FROM_11_TO_20', 'FROM_21_TO_30', 'MORE_THAN_30');

-- CreateEnum
CREATE TYPE "ExperienceLevel" AS ENUM ('JUNIOR', 'MID', 'SENIOR');

-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('ONE_TIME', 'CONTINUOUS');

-- CreateTable Location and Skill first (Listing will reference Location)
-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- AlterTable: add new columns with defaults for existing rows
ALTER TABLE "Listing" ADD COLUMN     "billingType" "BillingType" NOT NULL DEFAULT 'FIXED',
ADD COLUMN     "currency" VARCHAR(3) NOT NULL DEFAULT 'PLN',
ADD COLUMN     "experienceLevel" "ExperienceLevel" NOT NULL DEFAULT 'MID',
ADD COLUMN     "hoursPerWeek" "HoursPerWeek",
ADD COLUMN     "isRemote" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "locationId" TEXT,
ADD COLUMN     "projectType" "ProjectType" NOT NULL DEFAULT 'ONE_TIME',
ADD COLUMN     "rate" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ListingSkill" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,

    CONSTRAINT "ListingSkill_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Location_name_key" ON "Location"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Location_slug_key" ON "Location"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_name_key" ON "Skill"("name");

-- CreateIndex
CREATE INDEX "ListingSkill_listingId_idx" ON "ListingSkill"("listingId");

-- CreateIndex
CREATE INDEX "ListingSkill_skillId_idx" ON "ListingSkill"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "ListingSkill_listingId_skillId_key" ON "ListingSkill"("listingId", "skillId");

-- CreateIndex
CREATE INDEX "Listing_locationId_idx" ON "Listing"("locationId");

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingSkill" ADD CONSTRAINT "ListingSkill_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingSkill" ADD CONSTRAINT "ListingSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
