-- CreateEnum
CREATE TYPE "MailerLogStatus" AS ENUM ('PENDING', 'QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED', 'OPENED', 'CLICKED', 'RECEIVED', 'SPAM_COMPLAINT');

-- CreateTable
CREATE TABLE "MailerLog" (
    "id" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "MailerLogStatus" NOT NULL DEFAULT 'PENDING',
    "messageId" TEXT,
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MailerLog_pkey" PRIMARY KEY ("id")
);
