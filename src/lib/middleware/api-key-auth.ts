import { NextRequest } from 'next/server';
import { db, apiKeys, users } from '@/lib/db';
import { eq, and, or, gt, isNull } from 'drizzle-orm';

export interface ApiKeyUser {
  id: string;
  email: string;
  name: string | null;
}

/**
 * Authenticate via API Key (Authorization: Bearer ziliu_sk_xxx)
 * Returns user info if valid, null otherwise.
 */
export async function authenticateApiKey(request: NextRequest): Promise<ApiKeyUser | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ziliu_sk_')) {
    return null;
  }

  const key = authHeader.slice(7); // Remove "Bearer "

  const result = await db
    .select({
      keyId: apiKeys.id,
      userId: apiKeys.userId,
      expiresAt: apiKeys.expiresAt,
      email: users.email,
      name: users.name,
    })
    .from(apiKeys)
    .innerJoin(users, eq(apiKeys.userId, users.id))
    .where(eq(apiKeys.key, key))
    .limit(1);

  if (result.length === 0) return null;

  const row = result[0];

  // Check expiry
  if (row.expiresAt && row.expiresAt < new Date()) return null;

  // Update lastUsedAt (fire and forget)
  db.update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, row.keyId))
    .then(() => {})
    .catch(() => {});

  return { id: row.userId, email: row.email, name: row.name };
}

/**
 * Get authenticated user from either NextAuth session or API Key.
 * Returns { id, email, name } or null.
 */
export async function getAuthUser(request: NextRequest): Promise<ApiKeyUser | null> {
  // Try API key first (faster, no cookie parsing)
  const apiKeyUser = await authenticateApiKey(request);
  if (apiKeyUser) return apiKeyUser;

  // Fall back to NextAuth session
  const { getServerSession } = await import('next-auth');
  const { authOptions } = await import('@/lib/auth');
  const session = await getServerSession(authOptions);
  if (session?.user?.id && session?.user?.email) {
    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name ?? null,
    };
  }

  return null;
}
