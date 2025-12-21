import { Hono } from 'hono';
import type { DbClient } from '../../db';

export function createProjectFlagsRouter(db: DbClient) {
  const flagsRouter = new Hono();

  flagsRouter.get('/', async (c) => {
    return c.json({ message: 'Hello, world!' });
  });

  return flagsRouter;
}
