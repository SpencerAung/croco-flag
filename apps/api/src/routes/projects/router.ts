import { Hono } from 'hono';
import { describeRoute, resolver, validator as zValidator } from 'hono-openapi';
import type { DbClient } from '../../db';
import { projects } from '../../db/schema';
import { eq } from 'drizzle-orm';
import {
  createProjectSchema,
  updateProjectSchema,
  projectIdParamSchema,
  projectResponseSchema,
  projectWithRelationsResponseSchema,
  projectListResponseSchema,
  errorResponseSchema,
} from './schema';
import type { AuthVariables } from '../../middleware/auth';
import { sanitizeUser } from '../../utils/user';
import { flagListResponseSchema } from '../flags';

function sanitizeProjectUsers<
  T extends {
    creator?: { passwordHash?: string } | null;
    updator?: { passwordHash?: string } | null;
  },
>(project: T) {
  return {
    ...project,
    creator: project.creator ? sanitizeUser(project.creator) : null,
    updator: project.updator ? sanitizeUser(project.updator) : null,
  };
}

export function createProjectsRouter(db: DbClient) {
  const projectsRouter = new Hono<{ Variables: AuthVariables }>();

  projectsRouter.get(
    '/',
    describeRoute({
      tags: ['Projects'],
      summary: 'List all projects',
      description:
        'Returns all projects with creator and updator user relations',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'List of projects',
          content: {
            'application/json': { schema: resolver(projectListResponseSchema) },
          },
        },
      },
    }),
    async (c) => {
      const allProjects = await db.query.projects.findMany({
        with: {
          creator: true,
          updator: true,
        },
      });
      return c.json({ data: allProjects.map(sanitizeProjectUsers) });
    },
  );

  projectsRouter.get(
    '/:id',
    describeRoute({
      tags: ['Projects'],
      summary: 'Get a project by ID',
      description:
        'Returns a single project with creator and updator user relations',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Project found',
          content: {
            'application/json': {
              schema: resolver(projectWithRelationsResponseSchema),
            },
          },
        },
        404: {
          description: 'Project not found',
          content: {
            'application/json': { schema: resolver(errorResponseSchema) },
          },
        },
      },
    }),
    zValidator('param', projectIdParamSchema),
    async (c) => {
      const { id } = c.req.valid('param');
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
    },
  );

  projectsRouter.post(
    '/',
    describeRoute({
      tags: ['Projects'],
      summary: 'Create a new project',
      description:
        'Creates a new project with the authenticated user as creator',
      security: [{ bearerAuth: [] }],
      responses: {
        201: {
          description: 'Project created',
          content: {
            'application/json': { schema: resolver(projectResponseSchema) },
          },
        },
      },
    }),
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
    describeRoute({
      tags: ['Projects'],
      summary: 'Update a project',
      description: 'Updates an existing project',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Project updated',
          content: {
            'application/json': { schema: resolver(projectResponseSchema) },
          },
        },
        404: {
          description: 'Project not found',
          content: {
            'application/json': { schema: resolver(errorResponseSchema) },
          },
        },
      },
    }),
    zValidator('param', projectIdParamSchema),
    zValidator('json', updateProjectSchema),
    async (c) => {
      const { id } = c.req.valid('param');
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

  projectsRouter.delete(
    '/:id',
    describeRoute({
      tags: ['Projects'],
      summary: 'Delete a project',
      description: 'Deletes a project by ID',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Project deleted',
          content: {
            'application/json': { schema: resolver(projectResponseSchema) },
          },
        },
        404: {
          description: 'Project not found',
          content: {
            'application/json': { schema: resolver(errorResponseSchema) },
          },
        },
      },
    }),
    zValidator('param', projectIdParamSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const [project] = await db
        .delete(projects)
        .where(eq(projects.id, id))
        .returning();

      if (!project) {
        return c.json({ error: 'Project not found' }, 404);
      }

      return c.json({ data: project });
    },
  );

  projectsRouter.get(
    '/:id/flags',
    describeRoute({
      tags: ['Projects'],
      summary: 'Get project flags',
      description: 'Get the flags created in a project',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Project flags',
          content: {
            'application/json': { schema: resolver(flagListResponseSchema) },
          },
        },
      },
    }),
    zValidator('param', projectIdParamSchema),
    async (c) => {
      const { id } = c.req.valid('param');

      const flags = db.query.flags.findMany({
        where: eq(projects.id, id),
      });
      return c.json({ data: flags });
    },
  );

  return projectsRouter;
}
