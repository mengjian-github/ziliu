#!/usr/bin/env node
/**
 * Generate an API key for a user.
 * Usage: node scripts/generate-api-key.mjs <email> [name]
 * Example: node scripts/generate-api-key.mjs admin@ziliu.online pipeline-bot
 */
import { createClient } from '@libsql/client';
import { randomBytes } from 'crypto';
import { config } from 'dotenv';

config({ path: '.env.local' });
config();

const email = process.argv[2];
const keyName = process.argv[3] || 'default';

if (!email) {
  console.error('Usage: node scripts/generate-api-key.mjs <email> [name]');
  process.exit(1);
}

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || 'file:./dev.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Create table if not exists
await client.execute(`
  CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    last_used_at INTEGER,
    expires_at INTEGER,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )
`);

// Find user
const userResult = await client.execute({
  sql: 'SELECT id, email, name FROM users WHERE email = ?',
  args: [email],
});

if (userResult.rows.length === 0) {
  console.error(`User not found: ${email}`);
  console.log('Available users:');
  const allUsers = await client.execute('SELECT email, name FROM users LIMIT 10');
  allUsers.rows.forEach(r => console.log(`  ${r.email} (${r.name})`));
  process.exit(1);
}

const user = userResult.rows[0];
const apiKey = `ziliu_sk_${randomBytes(24).toString('hex')}`;
const id = randomBytes(12).toString('hex');

await client.execute({
  sql: 'INSERT INTO api_keys (id, user_id, key, name, created_at) VALUES (?, ?, ?, ?, ?)',
  args: [id, user.id, apiKey, keyName, Math.floor(Date.now() / 1000)],
});

console.log('✅ API Key generated successfully');
console.log(`   User:  ${user.email} (${user.name})`);
console.log(`   Name:  ${keyName}`);
console.log(`   Key:   ${apiKey}`);
console.log('');
console.log('Usage:');
console.log(`   curl -H "Authorization: Bearer ${apiKey}" https://ziliu.online/api/articles`);
