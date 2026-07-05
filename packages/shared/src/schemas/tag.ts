import { z } from 'zod';

export const createTagSchema = z.object({
  name: z.string().min(1).max(100),
});

export const tagSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  organizationId: z.string().uuid(),
  name: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CreateTag = z.infer<typeof createTagSchema>;
export type Tag = z.infer<typeof tagSchema>;
