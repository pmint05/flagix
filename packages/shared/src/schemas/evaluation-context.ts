import { z } from 'zod';

export const evaluationContextSchema = z.object({
  userId: z.string().optional(),
  role: z.string().optional(),
  attributes: z.record(z.string(), z.any()).optional(),
});

export type EvaluationContext = z.infer<typeof evaluationContextSchema>;
