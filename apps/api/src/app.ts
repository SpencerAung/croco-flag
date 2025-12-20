import { Hono } from 'hono';
import { createAuthRouter } from './routes/auth';
import { createProjectsRouter } from './routes/projects';
import { createFlagsRouter } from './routes/flags';
import { createUsersRouter } from './routes/users';
import { createProjectKeysRouter } from './routes/project-keys';
import { createSetupRouter } from './routes/setup';
import { authMiddleware } from './middleware';
import { db } from './db';

const app = new Hono();

// Public routes
app.route('/auth', createAuthRouter(db));
app.route('/setup', createSetupRouter(db));

// Protected routes (require JWT token)
app.use('/users/*', authMiddleware);
app.use('/projects/*', authMiddleware);
app.use('/flags/*', authMiddleware);

app.route('/users', createUsersRouter(db));
app.route('/projects', createProjectsRouter(db));
app.route('/projects/:projectId/keys', createProjectKeysRouter(db));
app.route('/flags', createFlagsRouter(db));

export default app;
