import { Hono } from 'hono';
import { describeRoute, resolver, validator as zValidator } from 'hono-openapi';
import type { DbClient } from '../../db';
import { users } from '../../db/schema';
import {
  initSetupSchema,
  setupStatusResponseSchema,
  userResponseSchema,
  errorResponseSchema,
} from './schema';
import { config } from '../../config';
import { sanitizeUser } from '../../utils/user';
import bcrypt from 'bcryptjs';

export function createSetupRouter(db: DbClient) {
  const setupRouter = new Hono();

  setupRouter.get(
    '/status',
    describeRoute({
      tags: ['Setup'],
      summary: 'Check system initialization status',
      description: 'Returns whether the system has been initialized with at least one user',
      responses: {
        200: {
          description: 'System status',
          content: {
            'application/json': { schema: resolver(setupStatusResponseSchema) },
          },
        },
      },
    }),
    async (c) => {
      const existingUsers = await db.query.users.findMany({ limit: 1 });

      return c.json({
        data: {
          initialized: existingUsers.length > 0,
        },
      });
    },
  );

  setupRouter.post(
    '/init',
    describeRoute({
      tags: ['Setup'],
      summary: 'Initialize the system',
      description: 'Creates the first admin user. Only works when no users exist.',
      responses: {
        201: {
          description: 'User created successfully',
          content: {
            'application/json': { schema: resolver(userResponseSchema) },
          },
        },
        403: {
          description: 'System already initialized',
          content: {
            'application/json': { schema: resolver(errorResponseSchema) },
          },
        },
      },
    }),
    zValidator('json', initSetupSchema),
    async (c) => {
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
    },
  );

  return setupRouter;
}
