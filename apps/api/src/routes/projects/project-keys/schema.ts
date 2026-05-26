import { z } from 'zod';
import { apiKeyTypeEnum } from '../../../db/schema';

export const createProjectKeySchema = z.object({
  name: z.string().min(1),
  type: z.enum(apiKeyTypeEnum.enumValues),
});

export type ApiKeyType = z.infer<typeof apiKeyTypeEnum>;
