import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Fallback for environments where DATABASE_URL is not set (e.g. prisma generate in CI/Docker build).
// Real DATABASE_URL is required for migrate and at runtime.
const databaseUrl =
  process.env.DATABASE_URL ?? 'postgresql://localhost:5432/updoo';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: databaseUrl,
  },
});
