import { Hono } from 'hono';
import type { DbClient } from '../../db';
import { eq } from 'drizzle-orm';
import { flags } from '../../db/schema';
import { zValidator } from '@hono/zod-validator';
import {
  createFlagSchema,
  flagIdParamSchema,
  flagResponseSchema,
  updateFlagSchema,
} from './schema';
import { describeRoute, resolver } from 'hono-openapi';
import { AuthVariables } from '../../middleware';

export function createFlagsRouter(db: DbClient) {
  const flagsRouter = new Hono<{ Variables: AuthVariables }>();

  flagsRouter.post(
    '/',
    describeRoute({
      tags: ['Flags'],
      summary: 'Create a new flag',
      description: 'Creates a new flag with authenticated user as creator',
      security: [{ bearAuth: [] }],
      responses: {
        201: {
          description: 'Flag created',
          content: {
            'application/json': { schema: resolver(flagResponseSchema) },
          },
        },
      },
    }),
    zValidator('json', createFlagSchema),
    async (c) => {
      const body = c.req.valid('json');
      const userId = c.get('userId');

      const [flag] = await db
        .insert(flags)
        .values({
          ...body,
          createdBy: userId,
          updatedBy: userId,
        })
        .returning();

      return c.json({ data: flag }, 201);
    },
  );

  flagsRouter.get(
    '/:id',
    describeRoute({
      tags: ['Flags'],
    }),
    zValidator('param', flagIdParamSchema),
    async (c) => {
      const { id } = c.req.valid('param');

      const flag = await db.query.flags.findFirst({
        where: eq(flags.id, id),
      });

      if (!flag) {
        return c.json({ error: 'Flag not found' }, 404);
      }

      return c.json({ data: flag });
    },
  );

  flagsRouter.put(
    '/:id',
    describeRoute({
      tags: ['Flags'],
    }),
    zValidator('param', flagIdParamSchema),
    zValidator('json', updateFlagSchema),
    async (c) => {
      const body = c.req.valid('json');
      const { id } = c.req.valid('param');
      const userId = c.get('userId');

      const [flag] = await db
        .update(flags)
        .set({
          ...body,
          updatedBy: userId,
          updatedAt: new Date(),
        })
        .where(eq(flags.id, id))
        .returning();

      if (!flag) {
        return c.json({ error: 'Flag not found' }, 404);
      }

      return c.json({ data: flag });
    },
  );

  flagsRouter.post(
    '/:id/archive',
    describeRoute({
      tags: ['Flags'],
    }),
    zValidator('param', flagIdParamSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const userId = c.get('userId');

      const [flag] = await db
        .update(flags)
        .set({
          isArchived: true,
          archivedBy: userId,
          archivedAt: new Date(),
        })
        .where(eq(flags.id, id))
        .returning();

      if (!flag) {
        return c.json({ error: 'Flag not found' }, 404);
      }

      return c.json({ data: flag });
    },
  );

  /**
   * TODO: delete
   * with confirmation flow. Only allow delete from admin dashboard
   */

  return flagsRouter;
}
