import type { InferSelectModel } from 'drizzle-orm';
import type { apiKeys } from '../../db/schema';
import { SanitizedUser } from '../users/types';
import { ApiResponse } from '../../types/common';

export type ApiKey = InferSelectModel<typeof apiKeys>;

export type ApiKeyWithRelations = ApiKey & {
  creator: SanitizedUser | null;
  revokedBy: SanitizedUser | null;
};

export type ApiKeyResponse = ApiResponse<ApiKey>;
export type ApiKeyWithRelationsResponse = ApiResponse<ApiKeyWithRelations>;
export type ApiKeyListResponse = ApiResponse<ApiKeyWithRelations[]>;
