-- CreateEnum
CREATE TYPE "CompanySize" AS ENUM ('FREELANCER', 'MICRO', 'SMALL', 'MEDIUM', 'LARGE');

-- AlterTable
ALTER TABLE "Company" ADD COLUMN "companySize" "CompanySize";
