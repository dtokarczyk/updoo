-- CreateEnum
CREATE TYPE "ExpectedApplicantType" AS ENUM ('FREELANCER_NO_B2B', 'FREELANCER_B2B', 'COMPANY');

-- AlterTable
ALTER TABLE "Job" ADD COLUMN "expectedApplicantType" "ExpectedApplicantType";
