-- AlterEnum
ALTER TYPE "JobStatus" ADD VALUE 'CLOSED';

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "closedAt" TIMESTAMP(3);
