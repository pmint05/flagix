import { z } from 'zod';
import { flagTypeEnum } from './enums';
import { variationInputSchema } from './variation';

export const createFeatureFlagSchema = z.object({
  key: z.string().regex(/^[a-zA-Z0-9_-]+$/).min(1).max(255),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  flagType: flagTypeEnum,
  variations: z.array(variationInputSchema).optional(),
  defaultVariationKey: z.string().min(1).optional(),
});

export const updateFeatureFlagSchema = createFeatureFlagSchema
  .partial()
  .extend({
    version: z.number().int().positive().optional(),
    isEnabled: z.boolean().optional(),
    status: z.enum(['draft', 'active', 'archived']).optional(),
  });

export type CreateFeatureFlag = z.infer<typeof createFeatureFlagSchema>;
export type UpdateFeatureFlag = z.infer<typeof updateFeatureFlagSchema>;
