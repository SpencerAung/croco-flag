import { z } from 'zod';
import { sanitizedUserSchema } from '../setup/schema';

export const tokenRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const tokenResponseSchema = z.object({
  data: z.object({
    token: z.string(),
    expiresIn: z.number(),
    user: sanitizedUserSchema,
  }),
});

export const meResponseSchema = z.object({
  data: sanitizedUserSchema,
});

export const errorResponseSchema = z.object({
  error: z.string(),
});

export type TokenRequestInput = z.infer<typeof tokenRequestSchema>;
