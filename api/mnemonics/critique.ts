import type { Request, Response } from 'express';
import { z } from 'zod';
import { critiqueMnemonic } from '../_lib/ai/gemini';
import { requireAuth } from '../_lib/auth/verify';
import { json, error, handleError } from '../_lib/http';

const bodySchema = z.object({
  hanzi: z.string().min(1),
  pinyin: z.string().min(1),
  tone: z.number().int().min(0).max(4),
  englishMeaning: z.string().min(1),
  radicalComponents: z.array(z.string()).min(1),
  userMnemonic: z.string().min(1),
  tonePegObject: z.string().min(1),
});

export default async function handler(req: Request, res: Response): Promise<void> {
  if (req.method !== 'POST') {
    error(res, 'METHOD_NOT_ALLOWED', 'POST only', 405);
    return;
  }

  try {
    await requireAuth(req);

    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ error: { code: 'INVALID_REQUEST', message: 'Invalid request body', details: parsed.error.flatten() } });
      return;
    }

    const result = await critiqueMnemonic(parsed.data);
    json(res, result);
  } catch (err) {
    if (err instanceof Error && err.message.includes('rate limit')) {
      error(res, 'RATE_LIMIT', err.message, 429);
      return;
    }
    handleError(res, err);
  }
}
