import type { Config } from 'drizzle-kit';

// 使用环境变量来决定配置
const isProduction = process.env.NODE_ENV === 'production' || process.env.TURSO_DATABASE_URL;

export default {
  schema: './src/lib/db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'sqlite',
  ...(isProduction && process.env.TURSO_DATABASE_URL 
    ? {
        dbCredentials: {
          url: process.env.TURSO_DATABASE_URL,
          authToken: process.env.TURSO_AUTH_TOKEN!,
        },
      }
    : {
        dbCredentials: {
          url: 'file:./dev.db',
        },
      }),
} satisfies Config;
