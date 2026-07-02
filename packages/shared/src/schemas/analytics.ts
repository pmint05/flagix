import { z } from 'zod';

export const analyticsTimeRangeSchema = z.object({
  from: z.iso.datetime().optional(),
  to: z.iso.datetime().optional(),
  granularity: z.enum(['hour', 'day']).optional(),
});

export type AnalyticsTimeRangeInput = z.infer<typeof analyticsTimeRangeSchema>;
