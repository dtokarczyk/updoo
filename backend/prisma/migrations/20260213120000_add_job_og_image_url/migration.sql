-- AlterTable
-- Add OG image URL for social sharing (generated on save, stored in S3).
ALTER TABLE "Job" ADD COLUMN "ogImageUrl" TEXT;
