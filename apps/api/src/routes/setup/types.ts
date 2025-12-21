import type { ApiResponse } from '../../types/common';
import type { UserResponse } from '../users/types';

export type SetupStatusResponse = ApiResponse<{ initialized: boolean }>;

// Re-export for convenience since setup creates users
export type { UserResponse };
