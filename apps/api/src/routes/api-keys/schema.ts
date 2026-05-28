import { z } from 'zod';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { apiKeys, apiKeyTypeEnum } from '../../db/schema';

const insertApiKeySchema = createInsertSchema(apiKeys, {
  name: z.string().min(1),
  createdAt: z.iso.datetime(),
  lastUsedAt: z.iso.datetime(),
  revokedAt: z.iso.datetime(),
});

const selectApiKeySchema = createSelectSchema(apiKeys, {
  createdAt: z.iso.datetime(),
  lastUsedAt: z.iso.datetime(),
  revokedAt: z.iso.datetime(),
});

export const projectKeyIdParamSchema = z.object({
  id: z.uuid().meta({ example: '770e8400-e29b-41d4-a716-446655440002' }),
});

export const createProjectKeySchema = insertApiKeySchema
  .pick({
    name: true,
    type: true,
    projectId: true,
  })
  .meta({
    examples: [
      {
        name: 'Production server',
        type: 'secret',
        projectId: '550e8400-e29b-41d4-a716-446655440000',
      },
    ],
  });

// keyHash is never exposed
export const projectKeySchema = selectApiKeySchema
  .omit({ keyHash: true })
  .meta({
    examples: [
      {
        id: '770e8400-e29b-41d4-a716-446655440002',
        projectId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Production server',
        type: 'secret',
        keyPrefix: 'sk__Dkj8sLmN',
        lastUsedAt: null,
        createdAt: '2024-01-15T10:30:00Z',
        revokedAt: null,
        createdBy: '550e8400-e29b-41d4-a716-446655440000',
        revokedBy: null,
      },
    ],
  });

// Only returned at creation time
export const createdProjectKeySchema = projectKeySchema.extend({
  key: z.string().meta({ example: 'sk__Dkj8sLmN3pQr5tUv7wXy9zA1' }),
});

export const projectKeyResponseSchema = z.object({ data: projectKeySchema });
export const createdProjectKeyResponseSchema = z.object({
  data: createdProjectKeySchema,
});
export const projectKeyListResponseSchema = z.object({
  data: z.array(projectKeySchema),
});

export const errorResponseSchema = z.object({ error: z.string() });

export type ApiKeyType = (typeof apiKeyTypeEnum.enumValues)[number];
