import { z } from 'zod';
import { variationValueSchema } from './variation';

export const evaluationResultSchema = z.object({
  flagKey: z.string(),
  enabled: z.boolean(),
  variationKey: z.string(),
  resolvedValue: variationValueSchema,
  evaluationReason: z.enum([
    'KILL_SWITCH',
    'USER_TARGETING',
    'ROLE_TARGETING',
    'PERCENTAGE_ROLLOUT',
    'DEFAULT',
    'FLAG_NOT_FOUND',
    'FLAG_ARCHIVED',
    'FLAG_DRAFT',
    'FLAG_DISABLED',
    'EVALUATION_ERROR',
  ]),
});

export type EvaluationResult = z.infer<typeof evaluationResultSchema>;
export type EvaluationReason = EvaluationResult['evaluationReason'];
