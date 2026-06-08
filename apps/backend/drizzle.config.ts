import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: ['./src/db/schema.ts', './src/db/auth-schema.ts'],
  out: './src/db/migrations',
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      'postgresql://flagix:root@localhost:5432/flagix_dev',
  },
  verbose: true,
  strict: true,
});
