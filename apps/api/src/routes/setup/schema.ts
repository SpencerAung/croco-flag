import { z } from 'zod';

export const initSetupSchema = z.object({
  email: z.email(),
  name: z.string().min(1).max(100),
  password: z.string().min(8).max(100),
});

export type InitSetupInput = z.infer<typeof initSetupSchema>;
