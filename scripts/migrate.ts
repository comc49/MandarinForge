import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '.env.local'), override: true });
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';

const url = process.env['DATABASE_URL_UNPOOLED'] || process.env['DATABASE_URL'];
if (!url) throw new Error('DATABASE_URL or DATABASE_URL_UNPOOLED must be set in .env.local');
const sql = neon(url);
const db = drizzle(sql);

migrate(db, { migrationsFolder: './migrations' })
  .then(() => {
    console.log('Migrations applied successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
