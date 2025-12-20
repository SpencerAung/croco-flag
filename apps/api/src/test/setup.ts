import { afterAll, beforeAll } from 'vitest';
import { sql } from 'drizzle-orm';
import { testDb, closeTestDb } from './db';
import * as schema from '../db/schema';

beforeAll(async () => {
  // Verify test database connection
  await testDb.execute(sql`SELECT 1`);
});

afterAll(async () => {
  await closeTestDb();
});

// Clean all tables - order matters due to foreign keys
export async function cleanDatabase() {
  await testDb.delete(schema.flagEvaluations);
  await testDb.delete(schema.targetingRules);
  await testDb.delete(schema.flags);
  await testDb.delete(schema.apiKeys);
  await testDb.delete(schema.projects);
  await testDb.delete(schema.users);
}
