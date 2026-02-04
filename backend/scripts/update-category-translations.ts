import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting category translations update...');

  // Get all categories
  const categories = await prisma.category.findMany({
    include: { translations: true },
  });

  console.log(`Found ${categories.length} categories`);

  const translations = [
    { slug: 'programowanie', pl: 'Programowanie', en: 'Programming' },
    { slug: 'design', pl: 'Design', en: 'Design' },
    { slug: 'marketing', pl: 'Marketing', en: 'Marketing' },
    { slug: 'pisanie', pl: 'Pisanie', en: 'Writing' },
    { slug: 'prace-biurowe', pl: 'Prace biurowe', en: 'Office Work' },
    { slug: 'inne', pl: 'Inne', en: 'Other' },
  ];

  for (const cat of categories) {
    console.log(`\nProcessing category: ${cat.slug} (ID: ${cat.id})`);
    console.log(`  Existing translations: ${cat.translations.length}`);
    cat.translations.forEach(t => {
      console.log(`    - ${t.language}: ${t.name}`);
    });

    const trans = translations.find((t) => t.slug === cat.slug);
    if (!trans) {
      console.log(`  ⚠️  No translation mapping found for ${cat.slug}, skipping`);
      continue;
    }

    // Polish translation
    const polishTrans = cat.translations.find((t) => t.language === 'POLISH');
    if (!polishTrans) {
      await prisma.categoryTranslation.create({
        data: {
          categoryId: cat.id,
          language: 'POLISH',
          name: trans.pl,
        },
      });
      console.log(`  ✅ Created Polish translation: ${trans.pl}`);
    } else if (polishTrans.name !== trans.pl) {
      await prisma.categoryTranslation.update({
        where: { id: polishTrans.id },
        data: { name: trans.pl },
      });
      console.log(`  🔄 Updated Polish translation: ${polishTrans.name} → ${trans.pl}`);
    } else {
      console.log(`  ✓ Polish translation already correct: ${trans.pl}`);
    }

    // English translation
    const englishTrans = cat.translations.find((t) => t.language === 'ENGLISH');
    if (!englishTrans) {
      await prisma.categoryTranslation.create({
        data: {
          categoryId: cat.id,
          language: 'ENGLISH',
          name: trans.en,
        },
      });
      console.log(`  ✅ Created English translation: ${trans.en}`);
    } else if (englishTrans.name !== trans.en) {
      await prisma.categoryTranslation.update({
        where: { id: englishTrans.id },
        data: { name: trans.en },
      });
      console.log(`  🔄 Updated English translation: ${englishTrans.name} → ${trans.en}`);
    } else {
      console.log(`  ✓ English translation already correct: ${trans.en}`);
    }
  }

  console.log('Category translations update completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
