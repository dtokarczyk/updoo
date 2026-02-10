-- AlterEnum
ALTER TYPE "JobStatus" ADD VALUE 'REJECTED';

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "rejectedReason" TEXT;
