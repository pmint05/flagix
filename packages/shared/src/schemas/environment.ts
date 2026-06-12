import { z } from 'zod';

export const createEnvironmentSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/).min(1).max(100).optional(),
  description: z.string().optional(),
});

export const updateEnvironmentSchema = createEnvironmentSchema.partial();

export type CreateEnvironment = z.infer<typeof createEnvironmentSchema>;
export type UpdateEnvironment = z.infer<typeof updateEnvironmentSchema>;
