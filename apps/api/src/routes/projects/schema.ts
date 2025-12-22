import { z } from 'zod';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { projects } from '../../db/schema';
import { sanitizedUserSchema } from '../setup/schema';

// Base schemas derived from DB with custom validations
const insertProjectSchema = createInsertSchema(projects, {
  name: z.string().min(1),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
const selectProjectSchema = createSelectSchema(projects, {
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

// Request schemas
export const createProjectSchema = insertProjectSchema
  .pick({ name: true, description: true })
  .meta({
    examples: [{ name: 'My Project', description: 'A feature flag project' }],
  });

export const updateProjectSchema = insertProjectSchema
  .pick({ name: true, description: true })
  .meta({
    examples: [{ name: 'Updated Project', description: 'Updated description' }],
  });

export const projectIdParamSchema = z.object({
  id: z.uuid().meta({ example: '550e8400-e29b-41d4-a716-446655440000' }),
});

// Response schemas
export const projectSchema = selectProjectSchema.meta({
  examples: [
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'My Project',
      description: 'A feature flag project',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T10:30:00Z',
      createdBy: '550e8400-e29b-41d4-a716-446655440000',
      updatedBy: '550e8400-e29b-41d4-a716-446655440000',
    },
  ],
});

export const projectWithRelationsSchema = projectSchema.extend({
  creator: sanitizedUserSchema.nullable(),
  updator: sanitizedUserSchema.nullable(),
});

export const projectResponseSchema = z.object({
  data: projectSchema,
});

export const projectWithRelationsResponseSchema = z.object({
  data: projectWithRelationsSchema,
});

export const projectListResponseSchema = z.object({
  data: z.array(projectWithRelationsSchema),
});

export const errorResponseSchema = z.object({
  error: z.string(),
});

export type CreateProjectSchema = z.infer<typeof createProjectSchema>;
export type UpdateProjectSchema = z.infer<typeof updateProjectSchema>;
