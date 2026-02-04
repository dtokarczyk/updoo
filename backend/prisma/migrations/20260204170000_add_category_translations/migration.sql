-- CreateTable
CREATE TABLE "CategoryTranslation" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "language" "ListingLanguage" NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategoryTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CategoryTranslation_categoryId_idx" ON "CategoryTranslation"("categoryId");

-- CreateIndex
CREATE INDEX "CategoryTranslation_language_idx" ON "CategoryTranslation"("language");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryTranslation_categoryId_language_key" ON "CategoryTranslation"("categoryId", "language");

-- AddForeignKey
ALTER TABLE "CategoryTranslation" ADD CONSTRAINT "CategoryTranslation_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing category names to Polish translations
INSERT INTO "CategoryTranslation" ("id", "categoryId", "language", "name", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text as "id",
    "id" as "categoryId",
    'POLISH' as "language",
    "name" as "name",
    NOW() as "createdAt",
    NOW() as "updatedAt"
FROM "Category"
WHERE "name" IS NOT NULL;

-- Add English translations
INSERT INTO "CategoryTranslation" ("id", "categoryId", "language", "name", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text as "id",
    "id" as "categoryId",
    'ENGLISH' as "language",
    CASE 
        WHEN "slug" = 'uslugi' THEN 'Services'
        WHEN "slug" = 'sprzedaz' THEN 'Sales'
        WHEN "slug" = 'praca' THEN 'Work'
        WHEN "slug" = 'nieruchomosci' THEN 'Real Estate'
        WHEN "slug" = 'motoryzacja' THEN 'Automotive'
        WHEN "slug" = 'inne' THEN 'Other'
        ELSE "name"
    END as "name",
    NOW() as "createdAt",
    NOW() as "updatedAt"
FROM "Category"
WHERE "name" IS NOT NULL;

-- Now drop the name column and constraint
ALTER TABLE "Category" DROP CONSTRAINT IF EXISTS "Category_name_key";
ALTER TABLE "Category" DROP COLUMN IF EXISTS "name";
