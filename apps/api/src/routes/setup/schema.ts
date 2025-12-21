import { z } from 'zod';

// Request schemas
export const initSetupSchema = z.object({
  email: z.email().meta({ example: 'admin@example.com' }),
  name: z.string().min(1).max(100).meta({ example: 'Admin User' }),
  password: z.string().min(8).max(100).meta({ example: 'securepass123' }),
});

// Response schemas
export const sanitizedUserSchema = z.object({
  id: z.uuid().meta({ example: '550e8400-e29b-41d4-a716-446655440000' }),
  email: z.email().meta({ example: 'admin@example.com' }),
  name: z.string().meta({ example: 'Admin User' }),
  createdAt: z.iso.datetime().meta({ example: '2024-01-15T10:30:00Z' }),
  updatedAt: z.iso.datetime().meta({ example: '2024-01-15T10:30:00Z' }),
});

export const setupStatusResponseSchema = z.object({
  data: z.object({
    initialized: z.boolean(),
  }),
});

export const userResponseSchema = z.object({
  data: sanitizedUserSchema,
});

export const errorResponseSchema = z.object({
  error: z.string(),
});

export type InitSetupInput = z.infer<typeof initSetupSchema>;
