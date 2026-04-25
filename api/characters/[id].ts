import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { getDb } from '../_lib/db/client';
import { characters } from '../_lib/db/schema';
import { json, error, handleError } from '../_lib/http';

export default async function handler(req: Request, res: Response): Promise<void> {
  if (req.method !== 'GET') {
    error(res, 'METHOD_NOT_ALLOWED', 'GET only', 405);
    return;
  }

  const id = parseInt(req.query['id'] as string, 10);
  if (isNaN(id)) {
    error(res, 'INVALID_REQUEST', 'Character ID must be a number', 400);
    return;
  }

  try {
    const db = getDb();
    const [character] = await db.select().from(characters).where(eq(characters.id, id));
    if (!character) {
      error(res, 'NOT_FOUND', 'Character not found', 404);
      return;
    }
    json(res, character);
  } catch (err) {
    handleError(res, err);
  }
}
