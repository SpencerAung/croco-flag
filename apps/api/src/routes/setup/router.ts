import { Hono } from 'hono';
import type { DbClient } from '../../db';
import { users } from '../../db/schema';
import { zValidator } from '@hono/zod-validator';
import { initSetupSchema } from './schema';
import { config } from '../../config';
import { sanitizeUser } from '../../utils/user';
import bcrypt from 'bcryptjs';

export function createSetupRouter(db: DbClient) {
  const setupRouter = new Hono();

  // Check if system needs initialization
  setupRouter.get('/status', async (c) => {
    const existingUsers = await db.query.users.findMany({ limit: 1 });

    return c.json({
      data: {
        initialized: existingUsers.length > 0,
      },
    });
  });

  // Initialize first admin user (only works if no users exist)
  setupRouter.post('/init', zValidator('json', initSetupSchema), async (c) => {
    const existingUsers = await db.query.users.findMany({ limit: 1 });

    if (existingUsers.length > 0) {
      return c.json({ error: 'System already initialized' }, 403);
    }

    const { password, ...rest } = c.req.valid('json');
    const passwordHash = await bcrypt.hash(password, config.bcryptRounds);

    const [user] = await db
      .insert(users)
      .values({ ...rest, passwordHash })
      .returning();

    return c.json({ data: sanitizeUser(user) }, 201);
  });

  return setupRouter;
}
