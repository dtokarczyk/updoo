/**
 * Seeds BenchmarkContent table from .txt files in scrapper/output.
 * Run from backend: npm run script:seed-benchmarks
 * Existing records (same `file`) are overwritten with new content.
 *
 * Verbose: VERBOSE=1 summary + progress, VERBOSE=2 log each file (insert/update).
 *   npm run script:seed-benchmarks -- VERBOSE=2
 *   VERBOSE=2 npm run script:seed-benchmarks
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

const SCRAPPER_OUTPUT =
  process.env.SCRAPPER_OUTPUT_PATH ??
  path.join(process.cwd(), '..', 'scrapper', 'output');

function getTxtFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    console.error(`Directory not found: ${dir}`);
    return [];
  }
  return fs.readdirSync(dir).filter((f) => f.endsWith('.txt'));
}

/**
 * Normalizes scraped text: collapse excessive spaces, line breaks, remove pilcrow/control chars.
 */
function formatContent(raw: string): string {
  return (
    raw
      .replace(/\r\n|\r/g, '\n')
      .replace(/\u00B6/g, '') // pilcrow ¶
      .replace(/[\t ]+/g, ' ')
      .replace(/\n[\s ]*\n/g, '\n\n')
      .replace(/ +\n/g, '\n')
      .replace(/\n +/g, '\n')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .join('\n\n')
      .trim()
  );
}

async function main() {
  const files = getTxtFiles(SCRAPPER_OUTPUT);
  if (files.length === 0) {
    console.log('No .txt files found in', SCRAPPER_OUTPUT);
    return;
  }

  const rows: { file: string; content: string }[] = [];

  for (const file of files) {
    const filePath = path.join(SCRAPPER_OUTPUT, file);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const content = formatContent(raw);
    rows.push({ file, content });
  }

  let inserted = 0;
  let updated = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const existed = await prisma.benchmarkContent.findUnique({
      where: { file: row.file },
      select: { id: true },
    });

    await prisma.benchmarkContent.upsert({
      where: { file: row.file },
      create: row,
      update: { content: row.content },
    });

    if (existed) updated++;
    else inserted++;

    if (VERBOSE >= 2) {
      console.log(`  ${existed ? 'update' : 'insert'}: ${row.file}`);
    } else if (VERBOSE >= 1 && (i + 1) % 100 === 0) {
      console.log(`  Progress: ${i + 1}/${rows.length}`);
    }
  }

  console.log(`Processed ${rows.length} records (${inserted} inserted, ${updated} updated).`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
