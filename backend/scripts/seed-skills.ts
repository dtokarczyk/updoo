/**
 * Seeds Skill table from a .json file (array of skill names).
 * Run from backend: npm run script:seed-skills
 * Existing records (same `name`) are kept; new names are inserted.
 *
 * Verbose: VERBOSE=1 summary + progress, VERBOSE=2 log each skill (insert/skip).
 *   npm run script:seed-skills -- VERBOSE=2
 *   VERBOSE=2 npm run script:seed-skills
 */
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const VERBOSE = parseInt(process.env.VERBOSE ?? '0', 10) || 0;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SKILLS_FILE =
  process.env.SEED_SKILLS_FILE ??
  path.join(process.cwd(), 'db_data', 'skills.json');

function getSkillNames(filePath: string): string[] {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return [];
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    console.error('Expected JSON array of skill names');
    return [];
  }
  return parsed
    .filter((item): item is string => typeof item === 'string')
    .map((s) => s.trim())
    .filter(Boolean);
}

async function main() {
  const names = getSkillNames(SKILLS_FILE);
  if (names.length === 0) {
    console.log('No skill names found in', SKILLS_FILE);
    return;
  }

  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    const existed = await prisma.skill.findUnique({
      where: { name },
      select: { id: true },
    });

    await prisma.skill.upsert({
      where: { name },
      create: { name },
      update: {},
    });

    if (existed) skipped++;
    else inserted++;

    if (VERBOSE >= 2) {
      console.log(`  ${existed ? 'skip' : 'insert'}: ${name}`);
    } else if (VERBOSE >= 1 && (i + 1) % 50 === 0) {
      console.log(`  Progress: ${i + 1}/${names.length}`);
    }
  }

  console.log(
    `Processed ${names.length} records (${inserted} inserted, ${skipped} already existed).`
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
