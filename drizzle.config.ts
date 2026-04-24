import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './api/_lib/db/schema.ts',
  out: './migrations',
  dialect: 'postgresql',
  // Migrations require a direct (unpooled) connection — pooled connections
  // don't support the DDL transactions drizzle-kit uses.
  dbCredentials: {
    url: process.env['DATABASE_URL_UNPOOLED']!,
  },
});
