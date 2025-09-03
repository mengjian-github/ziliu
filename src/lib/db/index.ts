import * as fs from 'fs';
import * as path from 'path';
import * as schema from './schema';

let db: any;

if (process.env.DATABASE_TYPE === 'sqlite') {
  // ✅ 本地 SQLite (better-sqlite3)
  const Database = require('better-sqlite3');
  const { drizzle } = require('drizzle-orm/better-sqlite3');

  // 默认路径 dev.db，确保目录存在
  let dbPath = process.env.DATABASE_URL || 'dev.db';

  // 去掉 file: 前缀（如果有的话）
  if (dbPath.startsWith('file:')) {
    dbPath = dbPath.replace(/^file:/, '');
  }

  const absPath = path.resolve(dbPath);
  const dir = path.dirname(absPath);

  // 如果目录不存在则创建
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const sqlite = new Database(absPath);
  db = drizzle(sqlite, { schema });
} else {
  // ✅ Turso / libsql
  const { drizzle } = require('drizzle-orm/libsql');
  const { createClient } = require('@libsql/client');

  const client = createClient({
    url: process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || 'file:./dev.db',
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  db = drizzle(client, { schema });
}

export { db };
export * from './schema';

