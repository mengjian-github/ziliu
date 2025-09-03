import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

console.log(process.env.TURSO_DATABASE_URL)

// 创建数据库客户端
const client = createClient({
  url: process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || 'file:./dev.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// 创建Drizzle实例
export const db = drizzle(client, { schema });

// 导出schema以便在其他地方使用
export * from './schema';
