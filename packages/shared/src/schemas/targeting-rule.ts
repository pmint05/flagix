import { z } from 'zod';
import {
  killSwitchConditionsSchema,
  userConditionsSchema,
  roleConditionsSchema,
  percentageConditionsSchema,
} from './rule-conditions';

export const createTargetingRuleSchema = z.discriminatedUnion('ruleType', [
  z.object({
    ruleType: z.literal('kill_switch'),
    variationId: z.uuid(),
    conditions: killSwitchConditionsSchema.optional(),
    isEnabled: z.boolean().optional(),
  }),
  z.object({
    ruleType: z.literal('user'),
    variationId: z.uuid(),
    conditions: userConditionsSchema,
    isEnabled: z.boolean().optional(),
  }),
  z.object({
    ruleType: z.literal('role'),
    variationId: z.uuid(),
    conditions: roleConditionsSchema,
    isEnabled: z.boolean().optional(),
  }),
  z.object({
    ruleType: z.literal('percentage'),
    variationId: z.uuid(),
    conditions: percentageConditionsSchema,
    isEnabled: z.boolean().optional(),
  }),
]);

export const updateTargetingRuleSchema = z.object({
  variationId: z.uuid().optional(),
  conditions: z.record(z.string(), z.unknown()).optional(),
  isEnabled: z.boolean().optional(),
  priority: z.string().optional(),
});

export type CreateTargetingRule = z.infer<typeof createTargetingRuleSchema>;
export type UpdateTargetingRule = z.infer<typeof updateTargetingRuleSchema>;
