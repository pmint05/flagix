import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as authSchema from './auth-schema';
import * as platformSchema from './schema';

export const platformTables = platformSchema;

export type Database = ReturnType<typeof createDrizzleClient>;

export function createDrizzleClient() {
  const connectionString =
    process.env.DATABASE_URL ??
    'postgresql://flagix:root@localhost:5432/flagix_dev';

  const pool = new Pool({ connectionString });

  return drizzle(pool, { schema: { ...authSchema, ...platformSchema } });
}
