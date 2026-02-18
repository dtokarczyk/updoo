-- CreateEnum
CREATE TYPE "ProposalReason" AS ENUM ('FB_GROUP');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "welcomeEmailSentAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL,
    "jobData" JSONB NOT NULL,
    "email" TEXT NOT NULL,
    "reason" "ProposalReason" NOT NULL,
    "token" TEXT NOT NULL,
    "status" "ProposalStatus" NOT NULL DEFAULT 'PENDING',
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "jobId" TEXT,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Proposal_token_key" ON "Proposal"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Proposal_jobId_key" ON "Proposal"("jobId");

-- CreateIndex
CREATE INDEX "Proposal_email_idx" ON "Proposal"("email");

-- CreateIndex
CREATE INDEX "Proposal_status_idx" ON "Proposal"("status");

-- CreateIndex
CREATE INDEX "Proposal_token_idx" ON "Proposal"("token");

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;
