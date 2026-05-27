import { Hono } from 'hono';
import type { DbClient } from '../../db';
import { eq } from 'drizzle-orm';
import { apiKeys } from '../../db/schema';
import { zValidator } from '@hono/zod-validator';
import { describeRoute, resolver } from 'hono-openapi';
import {
  createProjectKeySchema,
  projectKeyIdParamSchema,
  projectKeyResponseSchema,
  createdProjectKeyResponseSchema,
  errorResponseSchema,
} from './schema';
import { generateApiKey } from './utils';
import type { AuthVariables } from '../../middleware';

function stripKeyHash<T extends { keyHash: string }>(apiKey: T) {
  const { keyHash: _omitted, ...rest } = apiKey;
  return rest;
}

export function createProjectKeysRouter(db: DbClient) {
  const projectKeysRouter = new Hono<{ Variables: AuthVariables }>();

  projectKeysRouter.post(
    '/',
    describeRoute({
      tags: ['Project Keys'],
      summary: 'Create a new project API key',
      description:
        'Creates a new API key for a project. The plaintext key is returned only at creation time.',
      security: [{ bearerAuth: [] }],
      responses: {
        201: {
          description: 'API key created',
          content: {
            'application/json': {
              schema: resolver(createdProjectKeyResponseSchema),
            },
          },
        },
      },
    }),
    zValidator('json', createProjectKeySchema),
    async (c) => {
      const body = c.req.valid('json');
      const userId = c.get('userId');
      const { keyHash, plainTextKey, keyPrefix } = await generateApiKey(
        body.type,
      );

      const [apiKey] = await db
        .insert(apiKeys)
        .values({
          projectId: body.projectId,
          name: body.name,
          type: body.type,
          keyHash,
          keyPrefix,
          createdBy: userId,
        })
        .returning();

      return c.json(
        { data: { ...stripKeyHash(apiKey), key: plainTextKey } },
        201,
      );
    },
  );

  projectKeysRouter.get(
    '/:id',
    describeRoute({
      tags: ['Project Keys'],
      responses: {
        200: {
          description: 'API key',
          content: {
            'application/json': { schema: resolver(projectKeyResponseSchema) },
          },
        },
        404: {
          description: 'API key not found',
          content: {
            'application/json': { schema: resolver(errorResponseSchema) },
          },
        },
      },
    }),
    zValidator('param', projectKeyIdParamSchema),
    async (c) => {
      const { id } = c.req.valid('param');

      const apiKey = await db.query.apiKeys.findFirst({
        where: eq(apiKeys.id, id),
      });

      if (!apiKey) {
        return c.json({ error: 'API key not found' }, 404);
      }

      return c.json({ data: stripKeyHash(apiKey) });
    },
  );

  projectKeysRouter.post(
    '/:id/revoke',
    describeRoute({
      tags: ['Project Keys'],
      responses: {
        200: {
          description: 'API key revoked',
          content: {
            'application/json': { schema: resolver(projectKeyResponseSchema) },
          },
        },
        404: {
          description: 'API key not found',
          content: {
            'application/json': { schema: resolver(errorResponseSchema) },
          },
        },
      },
    }),
    zValidator('param', projectKeyIdParamSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const userId = c.get('userId');

      const [apiKey] = await db
        .update(apiKeys)
        .set({
          revokedAt: new Date(),
          revokedBy: userId,
        })
        .where(eq(apiKeys.id, id))
        .returning();

      if (!apiKey) {
        return c.json({ error: 'API key not found' }, 404);
      }

      return c.json({ data: stripKeyHash(apiKey) });
    },
  );

  return projectKeysRouter;
}
