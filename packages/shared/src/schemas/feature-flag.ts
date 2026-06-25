import { z } from 'zod';
import { flagTypeEnum, flagStatusEnum } from './enums';
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
  });

export const updateFlagStateSchema = z.object({
  isEnabled: z.boolean().optional(),
  status: flagStatusEnum.optional(),
  version: z.number().int().positive(),
});

export type CreateFeatureFlag = z.infer<typeof createFeatureFlagSchema>;
export type UpdateFeatureFlag = z.infer<typeof updateFeatureFlagSchema>;
export type UpdateFlagState = z.infer<typeof updateFlagStateSchema>;
