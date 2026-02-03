-- Migrate existing admins: set accountType to ADMIN where isAdmin was true
UPDATE "User" SET "accountType" = 'ADMIN' WHERE "isAdmin" = true;

-- Drop isAdmin column
ALTER TABLE "User" DROP COLUMN "isAdmin";
