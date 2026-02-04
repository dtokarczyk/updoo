-- Rename enum ListingStatus to JobStatus
ALTER TYPE "ListingStatus" RENAME TO "JobStatus";

-- Rename enum ListingLanguage to JobLanguage
ALTER TYPE "ListingLanguage" RENAME TO "JobLanguage";

-- Rename table Listing to Job
ALTER TABLE "Listing" RENAME TO "Job";

-- Rename table ListingApplication to JobApplication
ALTER TABLE "ListingApplication" RENAME TO "JobApplication";

-- Rename table ListingSkill to JobSkill
ALTER TABLE "ListingSkill" RENAME TO "JobSkill";

-- Rename column listingId to jobId in JobApplication
ALTER TABLE "JobApplication" RENAME COLUMN "listingId" TO "jobId";

-- Rename column listingId to jobId in JobSkill
ALTER TABLE "JobSkill" RENAME COLUMN "listingId" TO "jobId";

-- Rename column listingId to jobId in Favorite
ALTER TABLE "Favorite" RENAME COLUMN "listingId" TO "jobId";

-- Update User table: change language column type
ALTER TABLE "User" ALTER COLUMN "language" TYPE "JobLanguage" USING "language"::text::"JobLanguage";

-- Update CategoryTranslation table: change language column type
ALTER TABLE "CategoryTranslation" ALTER COLUMN "language" TYPE "JobLanguage" USING "language"::text::"JobLanguage";

-- Update Job table: change status and language column types
ALTER TABLE "Job" ALTER COLUMN "status" TYPE "JobStatus" USING "status"::text::"JobStatus";
ALTER TABLE "Job" ALTER COLUMN "language" TYPE "JobLanguage" USING "language"::text::"JobLanguage";
