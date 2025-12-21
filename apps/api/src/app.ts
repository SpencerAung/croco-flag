import { Hono } from 'hono';
import { createAuthRouter } from './routes/auth';
import { createProjectsRouter } from './routes/projects';
import { createUsersRouter } from './routes/users';
import { createProjectKeysRouter } from './routes/project-keys';
import { createProjectFlagsRouter } from './routes/project-flags';
import { createSetupRouter } from './routes/setup';
import { authMiddleware } from './middleware';
import { DbClient } from './db';

export const createApp = (db: DbClient) => {
  const app = new Hono();

  // Public routes
  app.route('/auth', createAuthRouter(db));
  app.route('/setup', createSetupRouter(db));

  // Protected routes (require JWT token)
  app.use('/users/*', authMiddleware);
  app.use('/projects/*', authMiddleware);

  app.route('/users', createUsersRouter(db));
  app.route('/projects', createProjectsRouter(db));
  app.route('/projects/:projectId/keys', createProjectKeysRouter(db));
  app.route('/projects/:projectId/flags', createProjectFlagsRouter(db));

  return app;
};

export default createApp;
