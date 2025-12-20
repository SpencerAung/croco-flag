import { Hono } from 'hono';
import { sign, verify } from 'hono/jwt';
import type { DbClient } from '../../db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator';
import { tokenRequestSchema } from './schema';
import { config } from '../../config';
import { sanitizeUser } from '../../utils/user';
import bcrypt from 'bcryptjs';

export function createAuthRouter(db: DbClient) {
  const authRouter = new Hono();

  // Exchange credentials for token
  authRouter.post('/token', zValidator('json', tokenRequestSchema), async (c) => {
    const { email, password } = c.req.valid('json');

    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    const now = Math.floor(Date.now() / 1000);
    const token = await sign(
      {
        sub: user.id,
        email: user.email,
        iat: now,
        exp: now + config.jwtExpirySeconds,
      },
      config.jwtSecret,
    );

    return c.json({
      data: {
        token,
        expiresIn: config.jwtExpirySeconds,
        user: sanitizeUser(user),
      },
    });
  });

  // Get current user from token
  authRouter.get('/me', async (c) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Token required' }, 401);
    }

    const token = authHeader.slice(7);

    try {
      const payload = await verify(token, config.jwtSecret);
      const user = await db.query.users.findFirst({
        where: eq(users.id, payload.sub as string),
      });

      if (!user) {
        return c.json({ error: 'User not found' }, 404);
      }

      return c.json({ data: sanitizeUser(user) });
    } catch {
      return c.json({ error: 'Invalid token' }, 401);
    }
  });

  return authRouter;
}
