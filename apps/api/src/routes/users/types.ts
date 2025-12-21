import type { InferSelectModel } from 'drizzle-orm';
import type { users } from '../../db/schema';
import type { ApiResponse } from '../../types/common';

export type User = InferSelectModel<typeof users>;

export type SanitizedUser = Omit<User, 'passwordHash'>;

export type UserResponse = ApiResponse<SanitizedUser>;
export type UserListResponse = ApiResponse<SanitizedUser[]>;
