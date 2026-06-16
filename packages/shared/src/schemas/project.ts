import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().regex(/^[a-z0-9-]+$/).min(1).max(100).optional(),
  description: z.string().optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

export type CreateProject = z.infer<typeof createProjectSchema>;
export type UpdateProject = z.infer<typeof updateProjectSchema>;
