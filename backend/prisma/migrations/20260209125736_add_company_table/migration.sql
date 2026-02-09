-- AlterTable
ALTER TABLE "User" ADD COLUMN     "companyId" TEXT;

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "regon" TEXT NOT NULL,
    "nip" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "voivodeship" TEXT,
    "county" TEXT,
    "commune" TEXT,
    "locality" TEXT,
    "postalCode" TEXT,
    "street" TEXT,
    "propertyNumber" TEXT,
    "apartmentNumber" TEXT,
    "type" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_regon_key" ON "Company"("regon");

-- CreateIndex
CREATE UNIQUE INDEX "Company_nip_key" ON "Company"("nip");

-- CreateIndex
CREATE INDEX "Company_nip_idx" ON "Company"("nip");

-- CreateIndex
CREATE INDEX "Company_regon_idx" ON "Company"("regon");

-- CreateIndex
CREATE INDEX "User_companyId_idx" ON "User"("companyId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
