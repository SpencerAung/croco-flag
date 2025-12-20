import { Hono } from 'hono';
import { createProjectsRouter } from './routes/projects';
import { createFlagsRouter } from './routes/flags';
import { createUsersRouter } from './routes/users';
import { createProjectKeysRouter } from './routes/project-keys';
import { db } from './db';

const app = new Hono();

app.route('/users', createUsersRouter(db));
app.route('/projects', createProjectsRouter(db));
app.route('/projects/:projectId/keys', createProjectKeysRouter(db));
app.route('/flags', createFlagsRouter(db));

export default app;
