import { Hono } from 'hono';
import { DbClient } from '../../db';
import { apiKeys } from '../../db/schema';
import { zValidator } from '@hono/zod-validator';
import { createProjectKeySchema } from './schema';
import { generateApiKey } from './utils';
import { eq } from 'drizzle-orm';

export function createProjectKeysRouter(db: DbClient) {
  const projectKeysRouter = new Hono();

  projectKeysRouter.get('/', async (c) => {
    const projectKeys = await db.query.apiKeys.findMany();
    return c.json({ data: projectKeys });
  });

  projectKeysRouter.post(
    '/',
    zValidator('json', createProjectKeySchema),
    async (c) => {
      const projectId = c.req.param('projectId');
      if (!projectId) {
        return c.json({ error: 'Project ID is required' }, 400);
      }

      const body = c.req.valid('json');
      const { keyHash, plainTextKey, keyPrefix } = await generateApiKey(
        body.type,
      );

      const [projectKey] = await db
        .insert(apiKeys)
        .values({
          projectId,
          name: body.name,
          type: body.type,
          keyHash,
          keyPrefix,
        })
        .returning();
      return c.json({ data: { ...projectKey, key: plainTextKey } });
    },
  );

  projectKeysRouter.delete('/:id', async (c) => {
    const projectKey = await db
      .delete(apiKeys)
      .where(eq(apiKeys.id, c.req.param('id')));
    return c.json({ data: projectKey });
  });

  return projectKeysRouter;
}
