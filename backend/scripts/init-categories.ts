import 'dotenv/config';
import { PrismaClient, JobLanguage } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DEFAULT_CATEGORIES = [
  {
    slug: 'programming',
    translations: [
      { language: JobLanguage.POLISH, name: 'Programowanie' },
      { language: JobLanguage.ENGLISH, name: 'Programming' },
    ],
  },
  {
    slug: 'design',
    translations: [
      { language: JobLanguage.POLISH, name: 'Design' },
      { language: JobLanguage.ENGLISH, name: 'Design' },
    ],
  },
  {
    slug: 'marketing',
    translations: [
      { language: JobLanguage.POLISH, name: 'Marketing' },
      { language: JobLanguage.ENGLISH, name: 'Marketing' },
    ],
  },
  {
    slug: 'writing',
    translations: [
      { language: JobLanguage.POLISH, name: 'Pisanie' },
      { language: JobLanguage.ENGLISH, name: 'Writing' },
    ],
  },
  {
    slug: 'office-working',
    translations: [
      { language: JobLanguage.POLISH, name: 'Prace biurowe' },
      { language: JobLanguage.ENGLISH, name: 'Office Work' },
    ],
  },
  {
    slug: 'other',
    translations: [
      { language: JobLanguage.POLISH, name: 'Inne' },
      { language: JobLanguage.ENGLISH, name: 'Other' },
    ],
  },
];

async function main() {
  console.log('Initializing categories...');

  for (const cat of DEFAULT_CATEGORIES) {
    let existing = await prisma.category.findUnique({
      where: { slug: cat.slug },
      include: { translations: true },
    });

    if (!existing) {
      existing = await prisma.category.create({
        data: {
          slug: cat.slug,
          translations: {
            create: cat.translations,
          },
        },
        include: { translations: true },
      });
      console.log(`Created category: ${cat.slug}`);
    } else {
      // Ensure all translations exist
      for (const trans of cat.translations) {
        const existingTrans = existing.translations.find(
          (t) => t.language === trans.language
        );
        if (!existingTrans) {
          await prisma.categoryTranslation.create({
            data: {
              categoryId: existing.id,
              language: trans.language,
              name: trans.name,
            },
          });
          console.log(`Added translation for ${cat.slug}: ${trans.language}`);
        }
      }
    }
  }

  console.log('✅ Categories initialized!');
}

main()
  .catch((e) => {
    console.error('Error initializing categories:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
