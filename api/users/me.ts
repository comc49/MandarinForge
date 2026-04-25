import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { getDb } from '../_lib/db/client';
import { users } from '../_lib/db/schema';
import { requireAuth } from '../_lib/auth/verify';
import { json, error, handleError } from '../_lib/http';

export default async function handler(req: Request, res: Response): Promise<void> {
  if (req.method !== 'GET') {
    error(res, 'METHOD_NOT_ALLOWED', 'GET only', 405);
    return;
  }

  try {
    const user = await requireAuth(req);
    const db = getDb();

    const [existing] = await db.select().from(users).where(eq(users.id, user.uid));
    if (existing) {
      json(res, existing);
      return;
    }

    // Auto-create so the app stays usable even if the sync call was missed.
    const [created] = await db
      .insert(users)
      .values({ id: user.uid, email: user.email, name: user.name || null })
      .returning();

    json(res, created, 201);
  } catch (err) {
    handleError(res, err);
  }
}
