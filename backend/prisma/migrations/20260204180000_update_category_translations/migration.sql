-- Update or insert Polish translations for all categories
INSERT INTO "CategoryTranslation" ("id", "categoryId", "language", "name", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text as "id",
    "id" as "categoryId",
    'POLISH' as "language",
    CASE 
        WHEN "slug" = 'programowanie' THEN 'Programowanie'
        WHEN "slug" = 'design' THEN 'Design'
        WHEN "slug" = 'marketing' THEN 'Marketing'
        WHEN "slug" = 'pisanie' THEN 'Pisanie'
        WHEN "slug" = 'prace-biurowe' THEN 'Prace biurowe'
        WHEN "slug" = 'inne' THEN 'Inne'
        ELSE "slug"
    END as "name",
    NOW() as "createdAt",
    NOW() as "updatedAt"
FROM "Category"
WHERE NOT EXISTS (
    SELECT 1 FROM "CategoryTranslation" 
    WHERE "CategoryTranslation"."categoryId" = "Category"."id" 
    AND "CategoryTranslation"."language" = 'POLISH'
)
ON CONFLICT ("categoryId", "language") DO UPDATE SET
    "name" = EXCLUDED."name",
    "updatedAt" = NOW();

-- Update or insert English translations for all categories
INSERT INTO "CategoryTranslation" ("id", "categoryId", "language", "name", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text as "id",
    "id" as "categoryId",
    'ENGLISH' as "language",
    CASE 
        WHEN "slug" = 'programowanie' THEN 'Programming'
        WHEN "slug" = 'design' THEN 'Design'
        WHEN "slug" = 'marketing' THEN 'Marketing'
        WHEN "slug" = 'pisanie' THEN 'Writing'
        WHEN "slug" = 'prace-biurowe' THEN 'Office Work'
        WHEN "slug" = 'inne' THEN 'Other'
        ELSE "slug"
    END as "name",
    NOW() as "createdAt",
    NOW() as "updatedAt"
FROM "Category"
WHERE NOT EXISTS (
    SELECT 1 FROM "CategoryTranslation" 
    WHERE "CategoryTranslation"."categoryId" = "Category"."id" 
    AND "CategoryTranslation"."language" = 'ENGLISH'
)
ON CONFLICT ("categoryId", "language") DO UPDATE SET
    "name" = EXCLUDED."name",
    "updatedAt" = NOW();
