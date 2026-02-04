import 'dotenv/config';
import { PrismaClient, BillingType, HoursPerWeek, ExperienceLevel, ProjectType, ListingStatus, ListingLanguage, AccountType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DEFAULT_CLIENT_USERS = [
  {
    email: 'client1@example.com',
    name: 'Client',
    surname: 'One',
  },
  {
    email: 'client2@example.com',
    name: 'Client',
    surname: 'Two',
  },
];

// Sample data for generating random listings
const TITLES_PL = [
  'Potrzebuję programisty React',
  'Szukam grafika do projektu',
  'Projekt strony internetowej',
  'Aplikacja mobilna iOS',
  'Backend w Node.js',
  'Design logo i brandingu',
  'Kopiowanie treści marketingowych',
  'Optymalizacja SEO',
  'Wsparcie techniczne',
  'Tłumaczenie dokumentacji',
  'Projekt UI/UX',
  'Integracja API',
  'Testy automatyczne',
  'Administracja serwerem',
  'Wsparcie w social media',
];

const TITLES_EN = [
  'Looking for React developer',
  'Need graphic designer',
  'Website project',
  'iOS mobile app',
  'Node.js backend',
  'Logo and branding design',
  'Marketing copywriting',
  'SEO optimization',
  'Technical support',
  'Documentation translation',
  'UI/UX design',
  'API integration',
  'Automated testing',
  'Server administration',
  'Social media support',
];

const DESCRIPTIONS_PL = [
  'Szukam doświadczonego freelancera do realizacji projektu. Wymagana znajomość nowoczesnych technologii i terminowość.',
  'Projekt wymaga kreatywnego podejścia i dbałości o szczegóły. Oferuję długoterminową współpracę.',
  'Potrzebuję wsparcia w rozwoju mojego biznesu. Szukam osoby z doświadczeniem w branży.',
  'Projekt jest pilny, więc szukam kogoś kto może rozpocząć od razu. Oferuję konkurencyjne wynagrodzenie.',
  'Szukam profesjonalisty z portfolio podobnych projektów. Możliwość pracy zdalnej.',
];

const DESCRIPTIONS_EN = [
  'Looking for an experienced freelancer to complete the project. Knowledge of modern technologies and punctuality required.',
  'The project requires a creative approach and attention to detail. I offer long-term cooperation.',
  'I need support in developing my business. Looking for someone with industry experience.',
  'The project is urgent, so I am looking for someone who can start immediately. I offer competitive compensation.',
  'Looking for a professional with a portfolio of similar projects. Remote work possible.',
];

const CURRENCIES = ['PLN', 'EUR', 'USD'];
const BILLING_TYPES: BillingType[] = [BillingType.FIXED, BillingType.HOURLY];
const HOURS_PER_WEEK: HoursPerWeek[] = [
  HoursPerWeek.LESS_THAN_10,
  HoursPerWeek.FROM_11_TO_20,
  HoursPerWeek.FROM_21_TO_30,
  HoursPerWeek.MORE_THAN_30,
];
const EXPERIENCE_LEVELS: ExperienceLevel[] = [ExperienceLevel.JUNIOR, ExperienceLevel.MID, ExperienceLevel.SENIOR];
const PROJECT_TYPES: ProjectType[] = [ProjectType.ONE_TIME, ProjectType.CONTINUOUS];
const LANGUAGES: ListingLanguage[] = [ListingLanguage.POLISH, ListingLanguage.ENGLISH];
const OFFER_DAYS = [7, 14, 21, 30];

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDecimal(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

async function main() {
  console.log('Starting generation of 100 random listings...');

  // Get required data
  const categories = await prisma.category.findMany();
  const locations = await prisma.location.findMany();
  const skills = await prisma.skill.findMany();
  let users = await prisma.user.findMany({
    where: { accountType: 'CLIENT' },
  });

  if (categories.length === 0) {
    throw new Error('No categories found. Please ensure categories are created first.');
  }

  if (users.length === 0) {
    console.log('No CLIENT users found, creating default CLIENT users...');
    const defaultPassword = await bcrypt.hash('Password123!', 10);
    users = await Promise.all(
      DEFAULT_CLIENT_USERS.map((u) =>
        prisma.user.create({
          data: {
            email: u.email,
            password: defaultPassword,
            name: u.name,
            surname: u.surname,
            accountType: AccountType.CLIENT,
          },
        }),
      ),
    );
    console.log(`Created ${users.length} default CLIENT users.`);
  }

  console.log(`Found ${categories.length} categories, ${locations.length} locations, ${skills.length} skills, ${users.length} CLIENT users`);

  const listingsToCreate = [];
  const now = new Date();

  for (let i = 0; i < 100; i++) {
    const language = randomElement(LANGUAGES);
    const titles = language === ListingLanguage.POLISH ? TITLES_PL : TITLES_EN;
    const descriptions = language === ListingLanguage.POLISH ? DESCRIPTIONS_PL : DESCRIPTIONS_EN;

    const billingType = randomElement(BILLING_TYPES);
    const hoursPerWeek = billingType === BillingType.HOURLY ? randomElement(HOURS_PER_WEEK) : null;

    const rate = billingType === BillingType.FIXED
      ? randomDecimal(500, 50000) // Fixed price: 500-50000
      : randomDecimal(50, 500); // Hourly rate: 50-500

    const currency = randomElement(CURRENCIES);
    const offerDays = randomElement(OFFER_DAYS);
    const deadline = new Date(now.getTime() + offerDays * 24 * 60 * 60 * 1000);

    // Random location (70% chance of having location, 30% remote only)
    const hasLocation = Math.random() > 0.3;
    const locationId = hasLocation && locations.length > 0 ? randomElement(locations).id : null;
    const isRemote = !hasLocation || Math.random() > 0.5;

    // Random skills (1-5 skills per listing)
    const numSkills = randomInt(1, Math.min(5, skills.length));
    const selectedSkills = skills.sort(() => Math.random() - 0.5).slice(0, numSkills);

    // Random creation date within last 30 days
    const daysAgo = randomInt(0, 30);
    const createdAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    listingsToCreate.push({
      title: randomElement(titles) + ` #${i + 1}`,
      description: randomElement(descriptions),
      categoryId: randomElement(categories).id,
      authorId: randomElement(users).id,
      status: ListingStatus.PUBLISHED, // All generated listings are published
      language,
      billingType,
      hoursPerWeek,
      rate,
      rateNegotiable: Math.random() > 0.7, // 30% chance of negotiable rate
      currency,
      experienceLevel: randomElement(EXPERIENCE_LEVELS),
      locationId,
      isRemote,
      projectType: randomElement(PROJECT_TYPES),
      deadline,
      createdAt,
      updatedAt: createdAt,
      skills: selectedSkills.map(skill => ({ skillId: skill.id })),
    });
  }

  console.log(`\nCreating ${listingsToCreate.length} listings...`);

  // Create listings in batches
  const batchSize = 10;
  let created = 0;

  for (let i = 0; i < listingsToCreate.length; i += batchSize) {
    const batch = listingsToCreate.slice(i, i + batchSize);

    for (const listingData of batch) {
      const { skills, ...listingFields } = listingData;

      const listing = await prisma.listing.create({
        data: {
          ...listingFields,
          skills: {
            create: skills.map((s: { skillId: string }) => ({
              skillId: s.skillId,
            })),
          },
        },
      });

      created++;
      if (created % 10 === 0) {
        console.log(`Created ${created}/${listingsToCreate.length} listings...`);
      }
    }
  }

  console.log(`\n✅ Successfully created ${created} listings!`);
}

main()
  .catch((e) => {
    console.error('Error generating listings:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
