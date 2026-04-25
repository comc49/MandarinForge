import type { Request, Response } from 'express';
import { sql } from 'drizzle-orm';
import { getDb } from '../_lib/db/client';
import { users } from '../_lib/db/schema';
import { requireAuth } from '../_lib/auth/verify';
import { json, error, handleError } from '../_lib/http';

export default async function handler(req: Request, res: Response): Promise<void> {
  if (req.method !== 'POST') {
    error(res, 'METHOD_NOT_ALLOWED', 'POST only', 405);
    return;
  }

  try {
    const user = await requireAuth(req);
    const db = getDb();

    // Prefer a name supplied in the body (e.g. from signUpWithEmail),
    // fall back to the display name baked into the token claim.
    const name = (req.body?.name as string | undefined)?.trim() || user.name || null;

    const [row] = await db
      .insert(users)
      .values({ id: user.uid, email: user.email, name })
      .onConflictDoUpdate({
        target: users.id,
        set: { email: user.email, name, lastActiveAt: sql`now()` },
      })
      .returning();

    json(res, row);
  } catch (err) {
    handleError(res, err);
  }
}
