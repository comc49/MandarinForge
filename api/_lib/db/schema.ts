import {
  pgTable,
  text,
  integer,
  serial,
  timestamp,
  boolean,
  real,
  date,
  uuid,
  jsonb,
  unique,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ---------------------------------------------------------------------------
// users
// id stores the Firebase UID directly — no generated UUID.
// ---------------------------------------------------------------------------
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  currentLevel: integer('current_level').default(1),
  dailyGoalMinutes: integer('daily_goal_minutes').default(20),
  createdAt: timestamp('created_at').defaultNow(),
  lastActiveAt: timestamp('last_active_at').defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// ---------------------------------------------------------------------------
// characters
// ---------------------------------------------------------------------------
export const characters = pgTable('characters', {
  id: serial('id').primaryKey(),
  hanzi: text('hanzi').notNull().unique(),
  pinyin: text('pinyin').notNull(),
  /** 0 = neutral, 1-4 = standard tones */
  tone: integer('tone').notNull(),
  englishMeaning: text('english_meaning').notNull(),
  hskLevel: integer('hsk_level').notNull(),
  /** [{char: string, meaning: string}] */
  radicalComponents: jsonb('radical_components').$type<{ char: string; meaning: string }[]>(),
  strokeCount: integer('stroke_count'),
});

export type Character = typeof characters.$inferSelect;
export type NewCharacter = typeof characters.$inferInsert;

// ---------------------------------------------------------------------------
// mnemonics
// ---------------------------------------------------------------------------
export const mnemonics = pgTable(
  'mnemonics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    characterId: integer('character_id')
      .notNull()
      .references(() => characters.id, { onDelete: 'cascade' }),
    substituteWordStory: text('substitute_word_story').notNull(),
    tonePegObject: text('tone_peg_object'),
    /** 1-10, nullable */
    vividnessScore: integer('vividness_score'),
    aiCritique: text('ai_critique'),
    aiSuggestions: jsonb('ai_suggestions').$type<string[]>(),
    isShared: boolean('is_shared').default(false),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => [
    unique('mnemonics_user_character_unique').on(t.userId, t.characterId),
    check(
      'mnemonics_tone_peg_check',
      sql`${t.tonePegObject} IN ('table','staircase','valley','axe','neutral') OR ${t.tonePegObject} IS NULL`,
    ),
  ],
);

export type Mnemonic = typeof mnemonics.$inferSelect;
export type NewMnemonic = typeof mnemonics.$inferInsert;

// ---------------------------------------------------------------------------
// practiceSessions
// ---------------------------------------------------------------------------
export const practiceSessions = pgTable(
  'practice_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    startedAt: timestamp('started_at').notNull(),
    endedAt: timestamp('ended_at'),
    sessionType: text('session_type').notNull(),
    targetWeakness: text('target_weakness'),
    results: jsonb('results').$type<Record<string, unknown>>(),
  },
  (t) => [
    check(
      'practice_sessions_type_check',
      sql`${t.sessionType} IN ('mnemonic_forge','tone_drill','sentence_reconstruction','palace_walk')`,
    ),
  ],
);

export type PracticeSession = typeof practiceSessions.$inferSelect;
export type NewPracticeSession = typeof practiceSessions.$inferInsert;

// ---------------------------------------------------------------------------
// weaknessProfile
// ---------------------------------------------------------------------------
export const weaknessProfile = pgTable(
  'weakness_profile',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    weaknessType: text('weakness_type').notNull(),
    /** float 0-1 */
    severity: real('severity').notNull(),
    lastTestedAt: timestamp('last_tested_at').notNull(),
    sampleErrors: jsonb('sample_errors').$type<unknown[]>(),
  },
  (t) => [unique('weakness_profile_user_type_unique').on(t.userId, t.weaknessType)],
);

export type WeaknessProfile = typeof weaknessProfile.$inferSelect;
export type NewWeaknessProfile = typeof weaknessProfile.$inferInsert;

// ---------------------------------------------------------------------------
// memoryPalaces
// ---------------------------------------------------------------------------
export const memoryPalaces = pgTable('memory_palaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  locationDescription: text('location_description'),
  /** [{name: string, vocabIds: number[]}] */
  rooms: jsonb('rooms').$type<{ name: string; vocabIds: number[] }[]>(),
  createdAt: timestamp('created_at').defaultNow(),
});

export type MemoryPalace = typeof memoryPalaces.$inferSelect;
export type NewMemoryPalace = typeof memoryPalaces.$inferInsert;

// ---------------------------------------------------------------------------
// sentences
// ---------------------------------------------------------------------------
export const sentences = pgTable('sentences', {
  id: serial('id').primaryKey(),
  chineseText: text('chinese_text'),
  pinyin: text('pinyin'),
  englishTranslation: text('english_translation'),
  hskLevel: integer('hsk_level'),
  grammarTags: jsonb('grammar_tags').$type<string[]>(),
});

export type Sentence = typeof sentences.$inferSelect;
export type NewSentence = typeof sentences.$inferInsert;

// ---------------------------------------------------------------------------
// coachGoals
// ---------------------------------------------------------------------------
export const coachGoals = pgTable('coach_goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  weekStarting: date('week_starting').notNull(),
  goalDescription: text('goal_description').notNull(),
  isStretch: boolean('is_stretch').notNull(),
  completionPercent: integer('completion_percent').default(0),
  aiReasoning: text('ai_reasoning'),
});

export type CoachGoal = typeof coachGoals.$inferSelect;
export type NewCoachGoal = typeof coachGoals.$inferInsert;
