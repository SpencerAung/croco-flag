import { z } from 'zod';

export const tokenRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type TokenRequestInput = z.infer<typeof tokenRequestSchema>;
