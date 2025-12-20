import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../db/schema';

// Use test database URL or fall back to dev with _test suffix
const testDatabaseUrl =
  process.env.TEST_DATABASE_URL ||
  process.env.DATABASE_URL?.replace(/\/([^/]+)$/, '/$1_test') ||
  'postgresql://postgres:postgres@localhost:5432/croco_flag_test';

const pool = new Pool({
  connectionString: testDatabaseUrl,
});

export const testDb = drizzle(pool, { schema });

export async function closeTestDb() {
  await pool.end();
}
