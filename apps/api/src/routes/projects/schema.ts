import { z } from 'zod';
import { sanitizedUserSchema } from '../setup/schema';

// Request schemas
export const createProjectSchema = z.object({
  name: z.string().min(1).meta({ example: 'My Project' }),
  description: z.string().optional().meta({ example: 'A feature flag project' }),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).meta({ example: 'Updated Project' }),
  description: z.string().optional().meta({ example: 'Updated description' }),
});

export const projectIdParamSchema = z.object({
  id: z.uuid().meta({ example: '550e8400-e29b-41d4-a716-446655440000' }),
});

// Response schemas
export const projectSchema = z.object({
  id: z.uuid().meta({ example: '550e8400-e29b-41d4-a716-446655440000' }),
  name: z.string().meta({ example: 'My Project' }),
  description: z.string().nullable().meta({ example: 'A feature flag project' }),
  createdAt: z.iso.datetime().meta({ example: '2024-01-15T10:30:00Z' }),
  updatedAt: z.iso.datetime().meta({ example: '2024-01-15T10:30:00Z' }),
  createdBy: z.uuid().nullable().meta({ example: '550e8400-e29b-41d4-a716-446655440000' }),
  updatedBy: z.uuid().nullable().meta({ example: '550e8400-e29b-41d4-a716-446655440000' }),
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
