import type { z } from 'zod';
import type { tokenResponseSchema, meResponseSchema, errorResponseSchema } from './schema';

export type TokenResponse = z.infer<typeof tokenResponseSchema>;
export type MeResponse = z.infer<typeof meResponseSchema>;
export type AuthErrorResponse = z.infer<typeof errorResponseSchema>;
