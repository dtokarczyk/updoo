-- AlterTable: make password optional for OAuth-only users (e.g. Google)
ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;

-- AlterTable: add Google OAuth subject (unique per Google account)
ALTER TABLE "User" ADD COLUMN "googleId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");
