import { z } from 'zod';
import { segmentCustomConditionsSchema } from './rule-conditions';

export const createSegmentSchema = z.object({
  name: z.string().min(1).max(255),
  key: z
    .string()
    .regex(/^[a-zA-Z0-9_-]+$/)
    .min(1)
    .max(255),
  description: z.string().optional().nullable(),
  conditions: segmentCustomConditionsSchema,
});

export const updateSegmentSchema = createSegmentSchema.partial();

export const segmentSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  projectId: z.string().uuid(),
  name: z.string(),
  key: z.string(),
  description: z.string().nullable(),
  conditions: segmentCustomConditionsSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CreateSegment = z.infer<typeof createSegmentSchema>;
export type UpdateSegment = z.infer<typeof updateSegmentSchema>;
export type Segment = z.infer<typeof segmentSchema>;
