import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

export type Database = ReturnType<typeof createDrizzleClient>;

export function createDrizzleClient() {
  const connectionString =
    process.env.DATABASE_URL ??
    'postgresql://flagix:root@localhost:5432/flagix_dev';

  const pool = new Pool({ connectionString });

  return drizzle(pool, { schema });
}
