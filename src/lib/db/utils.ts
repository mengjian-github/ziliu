import { createClient } from '@libsql/client';

// Ensure the `style` column exists on `articles` table at runtime for backward compatibility
export async function ensureArticleStyleColumn() {
  try {
    const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || 'file:./dev.db';
    const authToken = process.env.TURSO_AUTH_TOKEN;
    const client = createClient({ url, authToken });

    // Check existing columns
    const res = await client.execute(`PRAGMA table_info(articles);`);
    const hasStyle = Array.isArray(res.rows)
      ? res.rows.some((row: any) => row && (row.name === 'style' || row.column === 'style'))
      : false;

    if (!hasStyle) {
      await client.execute(`ALTER TABLE articles ADD COLUMN style TEXT DEFAULT 'default';`);
    }
  } catch (e) {
    // Do not block if the database is not accessible or command fails
    console.warn('[DB] ensureArticleStyleColumn skipped:', (e as Error).message);
  }
}

