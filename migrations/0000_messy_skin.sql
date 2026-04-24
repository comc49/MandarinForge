CREATE TABLE "characters" (
	"id" serial PRIMARY KEY NOT NULL,
	"hanzi" text NOT NULL,
	"pinyin" text NOT NULL,
	"tone" integer NOT NULL,
	"english_meaning" text NOT NULL,
	"hsk_level" integer NOT NULL,
	"radical_components" jsonb,
	"stroke_count" integer,
	CONSTRAINT "characters_hanzi_unique" UNIQUE("hanzi")
);
--> statement-breakpoint
CREATE TABLE "coach_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"week_starting" date NOT NULL,
	"goal_description" text NOT NULL,
	"is_stretch" boolean NOT NULL,
	"completion_percent" integer DEFAULT 0,
	"ai_reasoning" text
);
--> statement-breakpoint
CREATE TABLE "memory_palaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"location_description" text,
	"rooms" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mnemonics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"character_id" integer NOT NULL,
	"substitute_word_story" text NOT NULL,
	"tone_peg_object" text,
	"vividness_score" integer,
	"ai_critique" text,
	"ai_suggestions" jsonb,
	"is_shared" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "mnemonics_user_character_unique" UNIQUE("user_id","character_id"),
	CONSTRAINT "mnemonics_tone_peg_check" CHECK ("mnemonics"."tone_peg_object" IN ('table','staircase','valley','axe','neutral') OR "mnemonics"."tone_peg_object" IS NULL)
);
--> statement-breakpoint
CREATE TABLE "practice_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"started_at" timestamp NOT NULL,
	"ended_at" timestamp,
	"session_type" text NOT NULL,
	"target_weakness" text,
	"results" jsonb,
	CONSTRAINT "practice_sessions_type_check" CHECK ("practice_sessions"."session_type" IN ('mnemonic_forge','tone_drill','sentence_reconstruction','palace_walk'))
);
--> statement-breakpoint
CREATE TABLE "sentences" (
	"id" serial PRIMARY KEY NOT NULL,
	"chinese_text" text,
	"pinyin" text,
	"english_translation" text,
	"hsk_level" integer,
	"grammar_tags" jsonb
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"current_level" integer DEFAULT 1,
	"daily_goal_minutes" integer DEFAULT 20,
	"created_at" timestamp DEFAULT now(),
	"last_active_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "weakness_profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"weakness_type" text NOT NULL,
	"severity" real NOT NULL,
	"last_tested_at" timestamp NOT NULL,
	"sample_errors" jsonb,
	CONSTRAINT "weakness_profile_user_type_unique" UNIQUE("user_id","weakness_type")
);
--> statement-breakpoint
ALTER TABLE "coach_goals" ADD CONSTRAINT "coach_goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_palaces" ADD CONSTRAINT "memory_palaces_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mnemonics" ADD CONSTRAINT "mnemonics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mnemonics" ADD CONSTRAINT "mnemonics_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_sessions" ADD CONSTRAINT "practice_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weakness_profile" ADD CONSTRAINT "weakness_profile_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;