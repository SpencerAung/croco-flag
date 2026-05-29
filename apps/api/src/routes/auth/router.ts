import { Hono } from 'hono';
import { sign, verify } from 'hono/jwt';
import { describeRoute, resolver } from 'hono-openapi';
import type { DbClient } from '../../db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator';
import {
  tokenRequestSchema,
  tokenResponseSchema,
  meResponseSchema,
  errorResponseSchema,
} from './schema';
import { config } from '../../config';
import { sanitizeUser } from '../../utils/user';
import bcrypt from 'bcryptjs';

export function createAuthRouter(db: DbClient) {
  const authRouter = new Hono();

  // Exchange credentials for token
  authRouter.post(
    '/token',
    describeRoute({
      tags: ['Auth'],
      summary: 'Exchange credentials for a JWT',
      responses: {
        200: {
          description: 'Token issued',
          content: {
            'application/json': { schema: resolver(tokenResponseSchema) },
          },
        },
        401: {
          description: 'Invalid credentials',
          content: {
            'application/json': { schema: resolver(errorResponseSchema) },
          },
        },
      },
    }),
    zValidator('json', tokenRequestSchema),
    async (c) => {
      const { email, password } = c.req.valid('json');

      const user = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return c.json({ error: 'Unauthorized' }, 401);
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
    },
  );

  // Get current user from token
  authRouter.get(
    '/me',
    describeRoute({
      tags: ['Auth'],
      summary: 'Get the authenticated user',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Current user',
          content: {
            'application/json': { schema: resolver(meResponseSchema) },
          },
        },
        401: {
          description: 'Missing or invalid token',
          content: {
            'application/json': { schema: resolver(errorResponseSchema) },
          },
        },
      },
    }),
    async (c) => {
      const authHeader = c.req.header('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const token = authHeader.slice(7);

      try {
        const payload = await verify(token, config.jwtSecret);
        const user = await db.query.users.findFirst({
          where: eq(users.id, payload.sub as string),
        });

        if (!user) {
          return c.json({ error: 'Unauthorized' }, 401);
        }

        return c.json({ data: sanitizeUser(user) });
      } catch {
        return c.json({ error: 'Unauthorized' }, 401);
      }
    },
  );

  return authRouter;
}
