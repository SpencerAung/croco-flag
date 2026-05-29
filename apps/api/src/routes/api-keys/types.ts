import type { z } from 'zod';
import type { InferSelectModel } from 'drizzle-orm';
import type { apiKeys } from '../../db/schema';
import { SanitizedUser } from '../users/types';
import { ApiResponse } from '../../types/common';
import type {
  projectKeyResponseSchema,
  createdProjectKeyResponseSchema,
  projectKeyListResponseSchema,
} from './schema';

export type ApiKey = InferSelectModel<typeof apiKeys>;

export type ApiKeyWithRelations = ApiKey & {
  creator: SanitizedUser | null;
  revokedBy: SanitizedUser | null;
};

export type ApiKeyResponse = ApiResponse<ApiKey>;
export type ApiKeyWithRelationsResponse = ApiResponse<ApiKeyWithRelations>;
export type ApiKeyListResponse = ApiResponse<ApiKeyWithRelations[]>;

// Schema-derived response shapes — match what the router actually returns (no keyHash).
export type ProjectKeyResponse = z.infer<typeof projectKeyResponseSchema>;
export type CreatedProjectKeyResponse = z.infer<
  typeof createdProjectKeyResponseSchema
>;
export type ProjectKeyListResponse = z.infer<typeof projectKeyListResponseSchema>;
