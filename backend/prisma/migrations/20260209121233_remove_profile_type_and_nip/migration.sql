/*
  Warnings:

  - You are about to drop the column `nip` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Profile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "nip",
DROP COLUMN "type";

-- DropEnum
DROP TYPE "ProfileType";
