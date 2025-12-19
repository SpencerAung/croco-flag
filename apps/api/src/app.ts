import { Hono } from 'hono';
import { createProjectsRouter } from './routes/projects';
import { createFlagsRouter } from './routes/flags';
import { db } from './db';
import { createProjectKeysRouter } from './routes/project-keys';

const app = new Hono();

app.route('/projects', createProjectsRouter(db));
app.route('/projects/:projectId/keys', createProjectKeysRouter(db));
app.route('/flags', createFlagsRouter(db));

export default app;
