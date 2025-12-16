import type { Config } from 'drizzle-kit';

// Ensure drizzle-kit picks up the same env vars as Next.js (which loads `.env.local`).
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

function loadEnvFile(filename: string) {
  const fullPath = path.resolve(process.cwd(), filename);
  if (fs.existsSync(fullPath)) {
    dotenv.config({ path: fullPath });
  }
}

loadEnvFile('.env.local');
loadEnvFile('.env');

const databaseUrl = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || 'file:./dev.db';
const isRemote =
  databaseUrl.startsWith('libsql:') ||
  databaseUrl.startsWith('https:') ||
  databaseUrl.startsWith('wss:');

if (isRemote && !process.env.TURSO_AUTH_TOKEN) {
  throw new Error('Missing TURSO_AUTH_TOKEN for remote database (set TURSO_DATABASE_URL/TURSO_AUTH_TOKEN in .env.local).');
}

const dialect = isRemote ? ('turso' as const) : ('sqlite' as const);

export default {
  schema: './src/lib/db/schema.ts',
  out: './drizzle/migrations',
  dialect,
  dbCredentials: isRemote
    ? {
        url: databaseUrl,
        authToken: process.env.TURSO_AUTH_TOKEN!,
      }
    : {
        url: databaseUrl,
      },
} satisfies Config;
