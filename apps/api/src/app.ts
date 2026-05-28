import { Hono } from 'hono';
import { openAPIRouteHandler } from 'hono-openapi';
import { swaggerUI } from '@hono/swagger-ui';
import { createAuthRouter } from './routes/auth';
import { createProjectsRouter } from './routes/projects';
import { createUsersRouter } from './routes/users';
import { createApiKeysRouter } from './routes/api-keys';
import { createSetupRouter } from './routes/setup';
import { authMiddleware } from './middleware';
import { DbClient } from './db';
import { createFlagsRouter } from './routes/flags';

export const createApp = (db: DbClient) => {
  const app = new Hono()
    // Public routes
    .route('/auth', createAuthRouter(db))
    .route('/setup', createSetupRouter(db))
    // Protected routes (require JWT token)
    .use('/users/*', authMiddleware)
    .use('/projects/*', authMiddleware)
    .use('/flags/*', authMiddleware)
    .use('/keys/*', authMiddleware)
    .route('/users', createUsersRouter(db))
    .route('/projects', createProjectsRouter(db))
    .route('/flags', createFlagsRouter(db))
    .route('/keys', createApiKeysRouter(db));

  // OpenAPI documentation (not chained — not needed in AppType)
  app.get(
    '/openapi',
    openAPIRouteHandler(app, {
      documentation: {
        info: {
          title: 'CrocoFlag API',
          version: '1.0.0',
          description: 'Feature flag management API',
        },
        servers: [
          { url: 'http://localhost:3000', description: 'Local server' },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            },
          },
        },
      },
    }),
  );

  app.get('/docs', swaggerUI({ url: '/openapi' }));

  return app;
};

export type AppType = ReturnType<typeof createApp>;

export default createApp;
