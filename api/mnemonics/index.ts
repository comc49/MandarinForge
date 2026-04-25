import type { Request, Response } from 'express';
import { and, eq, desc, sql } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '../_lib/db/client';
import { mnemonics, characters } from '../_lib/db/schema';
import { requireAuth } from '../_lib/auth/verify';
import { json, error, handleError } from '../_lib/http';

// DB check constraint allows these values (or null).
const TON_PEG_VALUES = ['table', 'staircase', 'valley', 'axe', 'neutral'] as const;

const postBodySchema = z.object({
  characterId: z.number().int().positive(),
  substituteWordStory: z.string().min(1),
  tonePegObject: z.enum(TON_PEG_VALUES).nullable().optional(),
  // Critique fields — optional so the client can persist in one round-trip
  // after calling /api/mnemonics/critique, or save the story first.
  vividnessScore: z.number().int().min(1).max(10).nullable().optional(),
  aiCritique: z.string().nullable().optional(),
  aiSuggestions: z.array(z.string()).nullable().optional(),
  isShared: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// POST — create or update the mnemonic for (userId, characterId)
// ---------------------------------------------------------------------------
async function handlePost(req: Request, res: Response): Promise<void> {
  const user = await requireAuth(req);

  const parsed = postBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: {
        code: 'INVALID_REQUEST',
        message: 'Invalid request body',
        details: parsed.error.flatten(),
      },
    });
    return;
  }

  const { characterId, substituteWordStory, tonePegObject, vividnessScore, aiCritique, aiSuggestions, isShared } =
    parsed.data;

  const db = getDb();

  const [row] = await db
    .insert(mnemonics)
    .values({
      userId: user.uid,
      characterId,
      substituteWordStory,
      tonePegObject: tonePegObject ?? null,
      vividnessScore: vividnessScore ?? null,
      aiCritique: aiCritique ?? null,
      aiSuggestions: aiSuggestions ?? null,
      isShared: isShared ?? false,
    })
    .onConflictDoUpdate({
      target: [mnemonics.userId, mnemonics.characterId],
      set: {
        substituteWordStory,
        tonePegObject: tonePegObject ?? null,
        vividnessScore: vividnessScore ?? null,
        aiCritique: aiCritique ?? null,
        aiSuggestions: aiSuggestions ?? null,
        isShared: isShared ?? false,
        updatedAt: sql`now()`,
      },
    })
    .returning();

  json(res, row);
}

// ---------------------------------------------------------------------------
// GET — mnemonics for the current user, optionally filtered by characterId
// ---------------------------------------------------------------------------
async function handleGet(req: Request, res: Response): Promise<void> {
  const user = await requireAuth(req);
  const db = getDb();

  const charIdParam = req.query['characterId'];
  if (charIdParam !== undefined) {
    // Single-mnemonic lookup: return the mnemonic or null.
    const charId = parseInt(charIdParam as string, 10);
    if (isNaN(charId)) {
      error(res, 'INVALID_REQUEST', 'characterId must be a number', 400);
      return;
    }
    const [row] = await db
      .select({ mnemonic: mnemonics, character: characters })
      .from(mnemonics)
      .innerJoin(characters, eq(mnemonics.characterId, characters.id))
      .where(and(eq(mnemonics.userId, user.uid), eq(mnemonics.characterId, charId)));
    json(res, row ? { ...row.mnemonic, character: row.character } : null);
    return;
  }

  // Full list — all mnemonics for this user, newest first.
  const rows = await db
    .select({ mnemonic: mnemonics, character: characters })
    .from(mnemonics)
    .innerJoin(characters, eq(mnemonics.characterId, characters.id))
    .where(eq(mnemonics.userId, user.uid))
    .orderBy(desc(mnemonics.updatedAt));

  json(res, rows.map(({ mnemonic, character }) => ({ ...mnemonic, character })));
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------
export default async function handler(req: Request, res: Response): Promise<void> {
  try {
    if (req.method === 'POST') {
      await handlePost(req, res);
    } else if (req.method === 'GET') {
      await handleGet(req, res);
    } else {
      error(res, 'METHOD_NOT_ALLOWED', 'GET or POST only', 405);
    }
  } catch (err) {
    handleError(res, err);
  }
}
