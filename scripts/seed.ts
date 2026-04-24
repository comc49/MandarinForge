import 'dotenv/config';
import { readFileSync } from 'fs';
import { join } from 'path';
import { eq, sql } from 'drizzle-orm';
import { getDb } from '../api/_lib/db/client';
import {
  characters,
  sentences,
  users,
  type NewCharacter,
  type NewSentence,
} from '../api/_lib/db/schema';

const ROOT = join(__dirname, '..');

interface RawCharacter {
  hanzi: string;
  pinyin: string;
  tone: number;
  englishMeaning: string;
  hskLevel: number;
  radicalComponents: { char: string; meaning: string }[];
  strokeCount: number;
}

interface RawSentence {
  chineseText: string;
  pinyin: string;
  englishTranslation: string;
  hskLevel: number;
  grammarTags: string[];
}

async function main() {
  const db = getDb();

  // ── Demo user ────────────────────────────────────────────────────────────
  await db
    .insert(users)
    .values({ id: 'demo-user-001', email: 'demo@mandarinforge.local', name: 'Demo' })
    .onConflictDoNothing();
  console.log('✓ demo user upserted');

  // ── Characters ───────────────────────────────────────────────────────────
  const rawChars: RawCharacter[] = JSON.parse(
    readFileSync(join(ROOT, 'data/characters-hsk1-2.json'), 'utf-8'),
  );

  const charRows: NewCharacter[] = rawChars.map((c) => ({
    hanzi: c.hanzi,
    pinyin: c.pinyin,
    tone: c.tone,
    englishMeaning: c.englishMeaning,
    hskLevel: c.hskLevel,
    radicalComponents: c.radicalComponents,
    strokeCount: c.strokeCount ?? null,
  }));

  // Batch insert in chunks of 50 to avoid parameter limits
  const CHUNK = 50;
  let charInserted = 0;
  for (let i = 0; i < charRows.length; i += CHUNK) {
    const chunk = charRows.slice(i, i + CHUNK);
    await db.insert(characters).values(chunk).onConflictDoNothing();
    charInserted += chunk.length;
  }

  const charCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(characters);
  console.log(`✓ characters: ${charInserted} attempted, ${charCount[0].count} total in DB`);

  // ── Sentences ────────────────────────────────────────────────────────────
  const rawSents: RawSentence[] = JSON.parse(
    readFileSync(join(ROOT, 'data/sentences-hsk1-2.json'), 'utf-8'),
  );

  // Dedupe by chineseText: fetch existing texts, skip any already present
  const existing = await db.select({ text: sentences.chineseText }).from(sentences);
  const existingTexts = new Set(existing.map((r) => r.text));

  const newSentences: NewSentence[] = rawSents
    .filter((s) => !existingTexts.has(s.chineseText))
    .map((s) => ({
      chineseText: s.chineseText,
      pinyin: s.pinyin,
      englishTranslation: s.englishTranslation,
      hskLevel: s.hskLevel,
      grammarTags: s.grammarTags,
    }));

  if (newSentences.length > 0) {
    await db.insert(sentences).values(newSentences);
  }

  const sentCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(sentences);
  console.log(
    `✓ sentences: ${newSentences.length} inserted, ${sentCount[0].count} total in DB`,
  );

  console.log('\nSeed complete.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
