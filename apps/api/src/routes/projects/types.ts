import type { InferSelectModel } from 'drizzle-orm';
import type { projects } from '../../db/schema';
import type { ApiResponse } from '../../types/common';
import type { SanitizedUser } from '../users/types';

export type Project = InferSelectModel<typeof projects>;

export type ProjectWithRelations = Project & {
  creator: SanitizedUser | null;
  updator: SanitizedUser | null;
};

export type ProjectResponse = ApiResponse<Project>;
export type ProjectWithRelationsResponse = ApiResponse<ProjectWithRelations>;
export type ProjectListResponse = ApiResponse<ProjectWithRelations[]>;
