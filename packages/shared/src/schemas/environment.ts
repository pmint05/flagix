import { z } from 'zod';

export const environmentTypeEnum = z.enum([
  'development',
  'staging',
  'production',
  'custom',
]);

export const createEnvironmentSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/).min(1).max(100).optional(),
  type: environmentTypeEnum.default('development'),
  description: z.string().optional(),
});

export const updateEnvironmentSchema = createEnvironmentSchema
  .partial()
  .extend({
    isActive: z.boolean().optional(),
  });

export type CreateEnvironment = z.infer<typeof createEnvironmentSchema>;
export type UpdateEnvironment = z.infer<typeof updateEnvironmentSchema>;
