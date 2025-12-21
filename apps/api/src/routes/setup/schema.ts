import { z } from 'zod';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { users } from '../../db/schema';

// Base schemas derived from DB with custom validations
const insertUserSchema = createInsertSchema(users, {
  email: z.email(),
  name: z.string().min(1).max(100),
});
const selectUserSchema = createSelectSchema(users);

// Request schemas
export const initSetupSchema = insertUserSchema
  .pick({ email: true, name: true })
  .extend({
    password: z.string().min(8).max(100),
  })
  .meta({
    examples: [
      {
        email: 'admin@example.com',
        name: 'Admin User',
        password: 'securepass123',
      },
    ],
  });

// Response schemas - omit passwordHash for security
export const sanitizedUserSchema = selectUserSchema
  .omit({ passwordHash: true })
  .meta({
    examples: [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'admin@example.com',
        name: 'Admin User',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
      },
    ],
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
