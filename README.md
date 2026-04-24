# MandarinForge

> Master Mandarin Chinese through active recall, spaced repetition, and AI-powered coaching — combining Peak-style drilling with a Memory Book for vocabulary and grammar.

## Concept

MandarinForge applies two proven learning paradigms to Chinese:

- **Peak (deliberate practice)** — Every drill session is structured around targeted difficulty, instant feedback, and measurable progress metrics.
- **Memory Book** — A personal, living reference of vocabulary, grammar patterns, and sentences curated from your own study sessions and AI coaching.

Features are organised into five focused modules:

| Module | Description |
|---|---|
| **Forge** | Character and vocabulary flashcards with SRS scheduling |
| **Drill** | Listening, tones, reading, and writing exercises |
| **Palace** | Your Memory Book — saved words, phrases, grammar notes |
| **Coach** | Gemini-powered AI tutor: explanations, corrections, example sentences |
| **Dashboard** | Streak tracking, XP, progress charts, and learning stats |

## Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 21 (standalone components, signals, SSR) |
| Styling | Tailwind CSS v3 + Spartan UI (shadcn-style components) |
| Icons | Lucide Angular |
| State | NgRx Signals |
| Server Queries | TanStack Angular Query |
| Hosting | Vercel (SSR via Angular's `@angular/ssr` + serverless functions in `/api`) |
| Database | Neon Postgres (serverless) via Drizzle ORM |
| Auth | Firebase Authentication (Email/Password + Google) |
| AI | Google Gemini via `@google/generative-ai` |

## Project Structure

```
src/app/
  features/
    forge/         # Flashcards & SRS
    drill/         # Active exercises
    palace/        # Memory Book
    coach/         # AI tutor
    dashboard/     # Progress & stats
    auth/          # Login & signup
  core/
    services/      # Singleton services
    guards/        # Route guards
    interceptors/  # HTTP interceptors
  shared/
    ui/spartan/    # Spartan UI components (button, card, dialog, …)
    utils/         # Pinyin helpers, tone utilities

api/               # Vercel serverless functions
  _lib/            # DB, schema, AI, auth-verify, HTTP helpers

migrations/        # Drizzle migration files
data/              # Seed data (HSK word lists, etc.)
scripts/           # migrate.ts, seed.ts
```

## Getting Started

### 1. Prerequisites

- Node.js 22+
- npm 11+
- [Vercel CLI](https://vercel.com/docs/cli): `npm i -g vercel`

### 2. Clone and install

```bash
git clone <repo-url>
cd mandarinforge
npm install
```

### 3. Set up Neon Postgres

1. Create a project at [neon.tech](https://neon.tech)
2. Copy the **pooled** connection string → `DATABASE_URL`
3. Copy the **direct / unpooled** connection string → `DATABASE_URL_UNPOOLED`

### 4. Set up Firebase

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** → Sign-in methods → enable **Email/Password** and **Google**
3. Go to **Project Settings → Service accounts** → **Generate new private key** → download the JSON file
4. From the downloaded JSON, extract:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY`
     > **Important:** The private key contains literal `\n` newline sequences. In `.env.local`,
     > wrap the value in double quotes and keep the `\n` sequences as-is:
     > `FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"`
5. Under **Project Settings → General → Your apps**, register a **Web app** and copy:
   - `apiKey` → `NG_APP_FIREBASE_API_KEY`
   - `authDomain` → `NG_APP_FIREBASE_AUTH_DOMAIN`
   - `projectId` → `NG_APP_FIREBASE_PROJECT_ID`
   - `appId` → `NG_APP_FIREBASE_APP_ID`

### 5. Get a Gemini API key

1. Visit [aistudio.google.com](https://aistudio.google.com)
2. Create an API key → `GEMINI_API_KEY`

### 6. Configure environment

```bash
cp .env.example .env.local
# Fill in all values in .env.local
```

### 7. Run database migrations and seed

The **exact order matters** — migrations must exist before they can be applied, and the schema must exist before seeding.

```bash
npm run db:generate   # 1. generate SQL migration files from the Drizzle schema
npm run db:migrate    # 2. apply migrations to Neon (uses DATABASE_URL_UNPOOLED)
npm run db:seed       # 3. load 208 HSK 1-2 characters + 50 sentences + demo user
```

### 8. Start the dev server

```bash
npm run dev           # Angular dev server at http://localhost:4200
# or
npm run dev:vercel    # Vercel dev (SSR + API routes)
```

### 9. Explore Drizzle Studio (optional)

```bash
npm run db:studio     # opens a browser-based DB inspector
```

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✓ | Neon pooled connection string |
| `DATABASE_URL_UNPOOLED` | ✓ | Neon direct connection string (for migrations) |
| `GEMINI_API_KEY` | ✓ | Google AI Studio API key |
| `FIREBASE_PROJECT_ID` | ✓ | Firebase project ID (server-side Admin SDK) |
| `FIREBASE_CLIENT_EMAIL` | ✓ | Firebase service account email |
| `FIREBASE_PRIVATE_KEY` | ✓ | Firebase service account private key (include `\n` escapes) |
| `NG_APP_FIREBASE_API_KEY` | ✓ | Firebase Web SDK API key |
| `NG_APP_FIREBASE_AUTH_DOMAIN` | ✓ | Firebase auth domain |
| `NG_APP_FIREBASE_PROJECT_ID` | ✓ | Firebase project ID (client-side) |
| `NG_APP_FIREBASE_APP_ID` | ✓ | Firebase app ID |

## Deployment

Push to GitHub and connect the repo to Vercel. All `NG_APP_*` variables must also be added to the Vercel project environment settings so they are available at build time.

## License

MIT
