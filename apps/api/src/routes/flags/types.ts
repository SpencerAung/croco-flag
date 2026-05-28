import type { z } from 'zod';
import type {
  flagResponseSchema,
  flagWithRelationsResponseSchema,
  flagListResponseSchema,
  errorResponseSchema,
} from './schema';

export type FlagResponse = z.infer<typeof flagResponseSchema>;
export type FlagWithRelationsResponse = z.infer<
  typeof flagWithRelationsResponseSchema
>;
export type FlagListResponse = z.infer<typeof flagListResponseSchema>;
export type FlagErrorResponse = z.infer<typeof errorResponseSchema>;
