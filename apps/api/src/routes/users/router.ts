import { Hono } from 'hono';
import type { DbClient } from '../../db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator';
import { createUserSchema, updateUserSchema } from './schema';
import { config } from '../../config';
import { sanitizeUser } from '../../utils/user';
import bcrypt from 'bcryptjs';

export function createUsersRouter(db: DbClient) {
  const usersRouter = new Hono();

  usersRouter.get('/', async (c) => {
    const allUsers = await db.query.users.findMany();
    return c.json({ data: allUsers.map(sanitizeUser) });
  });

  usersRouter.get('/:id', async (c) => {
    const id = c.req.param('id');
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    });
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    return c.json({ data: sanitizeUser(user) });
  });

  usersRouter.post('/', zValidator('json', createUserSchema), async (c) => {
    const { password, ...rest } = c.req.valid('json');
    const passwordHash = await bcrypt.hash(password, config.bcryptRounds);

    const [user] = await db
      .insert(users)
      .values({ ...rest, passwordHash })
      .returning();

    return c.json({ data: sanitizeUser(user) }, 201);
  });

  usersRouter.put('/:id', zValidator('json', updateUserSchema), async (c) => {
    const id = c.req.param('id');
    const { password, ...rest } = c.req.valid('json');

    const updateData: Record<string, unknown> = { ...rest };
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, config.bcryptRounds);
    }

    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    return c.json({ data: sanitizeUser(user) });
  });

  usersRouter.delete('/:id', async (c) => {
    const id = c.req.param('id');
    const [user] = await db.delete(users).where(eq(users.id, id)).returning();

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    return c.json({ data: sanitizeUser(user) });
  });

  return usersRouter;
}
