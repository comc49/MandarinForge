import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';

const sql = neon(process.env['DATABASE_URL_UNPOOLED']!);
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
