import { z } from 'zod';

export const tokenRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export type TokenRequestInput = z.infer<typeof tokenRequestSchema>;
