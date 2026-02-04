-- AlterTable
ALTER TABLE "Job" RENAME CONSTRAINT "Listing_pkey" TO "Job_pkey";

-- AlterTable
ALTER TABLE "JobApplication" RENAME CONSTRAINT "ListingApplication_pkey" TO "JobApplication_pkey";

-- AlterTable
ALTER TABLE "JobSkill" RENAME CONSTRAINT "ListingSkill_pkey" TO "JobSkill_pkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "defaultMessage" TEXT;

-- RenameForeignKey
ALTER TABLE "Favorite" RENAME CONSTRAINT "Favorite_listingId_fkey" TO "Favorite_jobId_fkey";

-- RenameForeignKey
ALTER TABLE "Job" RENAME CONSTRAINT "Listing_authorId_fkey" TO "Job_authorId_fkey";

-- RenameForeignKey
ALTER TABLE "Job" RENAME CONSTRAINT "Listing_categoryId_fkey" TO "Job_categoryId_fkey";

-- RenameForeignKey
ALTER TABLE "Job" RENAME CONSTRAINT "Listing_locationId_fkey" TO "Job_locationId_fkey";

-- RenameForeignKey
ALTER TABLE "JobApplication" RENAME CONSTRAINT "ListingApplication_freelancerId_fkey" TO "JobApplication_freelancerId_fkey";

-- RenameForeignKey
ALTER TABLE "JobApplication" RENAME CONSTRAINT "ListingApplication_listingId_fkey" TO "JobApplication_jobId_fkey";

-- RenameForeignKey
ALTER TABLE "JobSkill" RENAME CONSTRAINT "ListingSkill_listingId_fkey" TO "JobSkill_jobId_fkey";

-- RenameForeignKey
ALTER TABLE "JobSkill" RENAME CONSTRAINT "ListingSkill_skillId_fkey" TO "JobSkill_skillId_fkey";

-- RenameIndex
ALTER INDEX "Favorite_listingId_idx" RENAME TO "Favorite_jobId_idx";

-- RenameIndex
ALTER INDEX "Favorite_userId_listingId_key" RENAME TO "Favorite_userId_jobId_key";

-- RenameIndex
ALTER INDEX "Listing_authorId_idx" RENAME TO "Job_authorId_idx";

-- RenameIndex
ALTER INDEX "Listing_categoryId_idx" RENAME TO "Job_categoryId_idx";

-- RenameIndex
ALTER INDEX "Listing_createdAt_idx" RENAME TO "Job_createdAt_idx";

-- RenameIndex
ALTER INDEX "Listing_language_idx" RENAME TO "Job_language_idx";

-- RenameIndex
ALTER INDEX "Listing_locationId_idx" RENAME TO "Job_locationId_idx";

-- RenameIndex
ALTER INDEX "Listing_status_idx" RENAME TO "Job_status_idx";

-- RenameIndex
ALTER INDEX "ListingApplication_freelancerId_idx" RENAME TO "JobApplication_freelancerId_idx";

-- RenameIndex
ALTER INDEX "ListingApplication_listingId_freelancerId_key" RENAME TO "JobApplication_jobId_freelancerId_key";

-- RenameIndex
ALTER INDEX "ListingApplication_listingId_idx" RENAME TO "JobApplication_jobId_idx";

-- RenameIndex
ALTER INDEX "ListingSkill_listingId_idx" RENAME TO "JobSkill_jobId_idx";

-- RenameIndex
ALTER INDEX "ListingSkill_listingId_skillId_key" RENAME TO "JobSkill_jobId_skillId_key";

-- RenameIndex
ALTER INDEX "ListingSkill_skillId_idx" RENAME TO "JobSkill_skillId_idx";
