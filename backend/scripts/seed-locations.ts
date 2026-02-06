/**
 * Seeds Location table from miasta_woj.sql (Polish cities).
 * Run from backend: npm run script:seed-locations
 * Parses city names from SQL INSERT VALUES; createMany with skipDuplicates (no upsert).
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

const SQL_PATH =
  process.env.SEED_LOCATIONS_SQL ??
  path.join(process.cwd(), 'db_data', 'miasta_woj.sql');

const POLISH_MAP: Record<string, string> = {
  ą: 'a',
  ć: 'c',
  ę: 'e',
  ł: 'l',
  ń: 'n',
  ó: 'o',
  ś: 's',
  ź: 'z',
  ż: 'z',
  Ą: 'a',
  Ć: 'c',
  Ę: 'e',
  Ł: 'l',
  Ń: 'n',
  Ó: 'o',
  Ś: 's',
  Ź: 'z',
  Ż: 'z',
};

function nameToSlug(name: string): string {
  let s = name.trim();
  for (const [pol, asc] of Object.entries(POLISH_MAP)) {
    s = s.replace(new RegExp(pol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), asc);
  }
  s = s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return s || 'location';
}

/** Parses city names from miasta INSERT VALUES in SQL content. */
function parseCityNamesFromSql(content: string): string[] {
  const names: string[] = [];
  const re = /\(\d+,\s*\d+,\s*'([^']+)'\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    names.push(m[1].trim());
  }
  return names;
}

/** Ensures unique slugs: if duplicate slug, append -2, -3, etc. */
function assignUniqueSlugs(
  names: string[],
): Array<{ name: string; slug: string }> {
  const used = new Set<string>();
  const result: Array<{ name: string; slug: string }> = [];
  for (const name of names) {
    let slug = nameToSlug(name);
    let candidate = slug;
    let n = 1;
    while (used.has(candidate)) {
      candidate = `${slug}-${++n}`;
    }
    used.add(candidate);
    result.push({ name, slug: candidate });
  }
  return result;
}

function getLocationsFromSqlFile(sqlPath: string): Array<{ name: string; slug: string }> {
  if (!fs.existsSync(sqlPath)) {
    return [];
  }
  const content = fs.readFileSync(sqlPath, 'utf-8');
  const names = parseCityNamesFromSql(content);
  return assignUniqueSlugs(names);
}

async function main() {
  const locations = getLocationsFromSqlFile(SQL_PATH);
  if (locations.length === 0) {
    console.log('No city names parsed from', SQL_PATH, '(file missing or empty)');
    return;
  }

  const result = await prisma.location.createMany({
    data: locations,
    skipDuplicates: true,
  });

  if (VERBOSE >= 1 || result.count > 0) {
    console.log(`Locations: ${result.count} created, ${locations.length - result.count} skipped (duplicates).`);
  }
}

main()
  .then(() => pool.end())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
