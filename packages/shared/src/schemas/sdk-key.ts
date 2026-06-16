import { z } from 'zod';

export const createSdkKeySchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(['client', 'server']),
});

export type CreateSdkKey = z.infer<typeof createSdkKeySchema>;
