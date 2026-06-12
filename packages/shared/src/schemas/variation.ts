import { z } from 'zod';

export const variationValueSchema = z.union([z.boolean(), z.string(), z.record(z.string(), z.unknown())]);

export const variationInputSchema = z.object({
  key: z.string().min(1).max(100),
  value: variationValueSchema,
  description: z.string().optional(),
});

export type VariationValue = z.infer<typeof variationValueSchema>;
export type VariationInput = z.infer<typeof variationInputSchema>;
