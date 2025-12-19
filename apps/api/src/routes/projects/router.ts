import { Hono } from 'hono';
import type { DbClient } from '../../db';
import { projects } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { createProjectSchema } from './schema';
import { zValidator } from '@hono/zod-validator';

export function createProjectsRouter(db: DbClient) {
  const projectsRouter = new Hono();

  projectsRouter.get('/', async (c) => {
    const projects = await db.query.projects.findMany();
    return c.json({ data: projects });
  });

  projectsRouter.post(
    '/',
    zValidator('json', createProjectSchema),
    async (c) => {
      const body = c.req.valid('json');
      const [project] = await db.insert(projects).values(body).returning();
      return c.json({ data: project });
    },
  );

  projectsRouter.put('/:id', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json();
    const [project] = await db
      .update(projects)
      .set(body)
      .where(eq(projects.id, id))
      .returning();
    return c.json({ data: project });
  });

  projectsRouter.delete('/:id', async (c) => {
    const id = c.req.param('id');
    const [project] = await db
      .delete(projects)
      .where(eq(projects.id, id))
      .returning();
    return c.json({ data: project });
  });

  return projectsRouter;
}
