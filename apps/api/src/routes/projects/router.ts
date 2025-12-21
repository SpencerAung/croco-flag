import { Hono } from 'hono';
import type { DbClient } from '../../db';
import { projects } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { createProjectSchema, updateProjectSchema } from './schema';
import { zValidator } from '@hono/zod-validator';
import type { AuthVariables } from '../../middleware/auth';
import { sanitizeUser } from '../../utils/user';

function sanitizeProjectUsers<
  T extends { creator?: { passwordHash?: string } | null; updator?: { passwordHash?: string } | null },
>(project: T) {
  return {
    ...project,
    creator: project.creator ? sanitizeUser(project.creator) : null,
    updator: project.updator ? sanitizeUser(project.updator) : null,
  };
}

export function createProjectsRouter(db: DbClient) {
  const projectsRouter = new Hono<{ Variables: AuthVariables }>();

  projectsRouter.get('/', async (c) => {
    const allProjects = await db.query.projects.findMany({
      with: {
        creator: true,
        updator: true,
      },
    });
    return c.json({ data: allProjects.map(sanitizeProjectUsers) });
  });

  projectsRouter.get('/:id', async (c) => {
    const id = c.req.param('id');
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, id),
      with: {
        creator: true,
        updator: true,
      },
    });

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    return c.json({ data: sanitizeProjectUsers(project) });
  });

  projectsRouter.post(
    '/',
    zValidator('json', createProjectSchema),
    async (c) => {
      const body = c.req.valid('json');
      const userId = c.get('userId');

      const [project] = await db
        .insert(projects)
        .values({
          ...body,
          createdBy: userId,
          updatedBy: userId,
        })
        .returning();

      return c.json({ data: project }, 201);
    },
  );

  projectsRouter.put(
    '/:id',
    zValidator('json', updateProjectSchema),
    async (c) => {
      const id = c.req.param('id');
      const body = c.req.valid('json');
      const userId = c.get('userId');

      const [project] = await db
        .update(projects)
        .set({
          ...body,
          updatedBy: userId,
          updatedAt: new Date(),
        })
        .where(eq(projects.id, id))
        .returning();

      if (!project) {
        return c.json({ error: 'Project not found' }, 404);
      }

      return c.json({ data: project });
    },
  );

  projectsRouter.delete('/:id', async (c) => {
    const id = c.req.param('id');
    const [project] = await db
      .delete(projects)
      .where(eq(projects.id, id))
      .returning();

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    return c.json({ data: project });
  });

  return projectsRouter;
}
