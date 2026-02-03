-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('CLIENT', 'FREELANCER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "accountType" "AccountType";
