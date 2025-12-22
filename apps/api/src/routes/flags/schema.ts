import { z } from 'zod';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { flags } from '../../db/schema';
import { sanitizedUserSchema } from '../setup/schema';

// Base schemas derived from DB with custom validations
const insertFlagSchema = createInsertSchema(flags, {
  key: z.string().min(1).max(100),
  name: z.string().min(1).max(100),
  updatedAt: z.iso.datetime(),
  createdAt: z.iso.datetime(),
  archivedAt: z.iso.datetime(),
});
const selectFlagSchema = createSelectSchema(flags, {
  updatedAt: z.iso.datetime(),
  createdAt: z.iso.datetime(),
  archivedAt: z.iso.datetime(),
});

// Param schemas
export const flagIdParamSchema = z.object({
  id: z.uuid().meta({ example: '660e8400-e29b-41d4-a716-446655440001' }),
});

// Request schemas
export const createFlagSchema = insertFlagSchema
  .pick({
    key: true,
    name: true,
    description: true,
    enabled: true,
    isClientSide: true,
    defaultValue: true,
    projectId: true,
  })
  .meta({
    examples: [
      {
        key: 'dark-mode',
        name: 'Dark Mode',
        description: 'Enable dark mode for users',
        enabled: false,
        isClientSide: true,
        defaultValue: false,
        projectId: '660e8400-e29b-41d4-a716-446655440001',
      },
    ],
  });

export const updateFlagSchema = insertFlagSchema
  .pick({
    name: true,
    description: true,
    enabled: true,
    isClientSide: true,
    defaultValue: true,
  })
  .meta({
    examples: [
      {
        name: 'Dark Mode Updated',
        description: 'Updated description',
        enabled: true,
        isClientSide: true,
        defaultValue: false,
      },
    ],
  });

// Response schemas
export const flagSchema = selectFlagSchema.meta({
  examples: [
    {
      id: '660e8400-e29b-41d4-a716-446655440001',
      projectId: '550e8400-e29b-41d4-a716-446655440000',
      key: 'dark-mode',
      name: 'Dark Mode',
      description: 'Enable dark mode for users',
      enabled: true,
      isClientSide: true,
      defaultValue: false,
      isArchived: false,
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T10:30:00Z',
      archivedAt: null,
      createdBy: '550e8400-e29b-41d4-a716-446655440000',
      updatedBy: '550e8400-e29b-41d4-a716-446655440000',
      archivedBy: null,
    },
  ],
});

export const flagWithRelationsSchema = flagSchema.extend({
  creator: sanitizedUserSchema.nullable(),
  updator: sanitizedUserSchema.nullable(),
});

export const flagResponseSchema = z.object({
  data: flagSchema,
});

export const flagWithRelationsResponseSchema = z.object({
  data: flagWithRelationsSchema,
});

export const flagListResponseSchema = z.object({
  data: z.array(flagWithRelationsSchema),
});

export const errorResponseSchema = z.object({
  error: z.string(),
});

export type CreateFlagSchema = z.infer<typeof createFlagSchema>;
export type UpdateFlagSchema = z.infer<typeof updateFlagSchema>;
