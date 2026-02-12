-- Add new array column
ALTER TABLE "Job" ADD COLUMN "expectedApplicantTypes" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Migrate existing single value to array
UPDATE "Job"
SET "expectedApplicantTypes" = ARRAY["expectedApplicantType"::text]
WHERE "expectedApplicantType" IS NOT NULL;

-- Drop old column
ALTER TABLE "Job" DROP COLUMN "expectedApplicantType";

-- Drop the enum type (no longer used by any column)
DROP TYPE "ExpectedApplicantType";
