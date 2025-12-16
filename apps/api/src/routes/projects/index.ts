import { Hono } from 'hono';
import type { DbClient } from '../../db';

export function createProjectsRouter(db: DbClient) {
  const projectsRouter = new Hono();

  projectsRouter.get('/', async (c) => {
    return c.json({ message: 'Hello, world!' });
  });

  return projectsRouter;
}
