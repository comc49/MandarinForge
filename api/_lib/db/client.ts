import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

type Db = ReturnType<typeof drizzle<typeof schema>>;

// Cached at module scope — reused across warm serverless invocations.
let _db: Db | null = null;

export function getDb(): Db {
  if (!_db) {
    _db = drizzle(neon(process.env['DATABASE_URL']!), { schema });
  }
  return _db;
}
