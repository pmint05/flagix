import { z } from 'zod';

export const killSwitchConditionsSchema = z.object({});

export const userConditionsSchema = z.object({
  userIds: z.array(z.string().min(1)).min(1),
});

export const roleConditionsSchema = z.object({
  roles: z.array(z.string().min(1)).min(1),
});

export const percentageConditionsSchema = z.object({
  rollouts: z.array(z.object({
    variationId: z.string().uuid(),
    percentage: z.number().int().min(0).max(100)
  })).min(1).optional(),
  percentage: z.number().int().min(0).max(100).optional(), // For backward compatibility
});

export const customConditionSchema = z.object({
  contextKey: z.string().min(1),
  type: z.enum(['string', 'number', 'boolean', 'object', 'array', 'semver', 'date']),
  operator: z.string().min(1),
  values: z.array(z.any()).optional(),
  value: z.any().optional(),
});

export const customConditionsSchema = z.object({
  conditions: z.array(customConditionSchema).min(1),
});

export const segmentCustomConditionsSchema = z.array(customConditionSchema).min(1);

export const segmentConditionsSchema = z.object({
  segmentIds: z.array(z.string().uuid()).min(1),
  operator: z.enum(['in', 'not_in']),
});

export const ruleConditionsSchema = z.discriminatedUnion('ruleType', [
  z.object({ ruleType: z.literal('kill_switch'), conditions: killSwitchConditionsSchema }),
  z.object({ ruleType: z.literal('user'), conditions: userConditionsSchema }),
  z.object({ ruleType: z.literal('role'), conditions: roleConditionsSchema }),
  z.object({ ruleType: z.literal('percentage'), conditions: percentageConditionsSchema }),
  z.object({ ruleType: z.literal('custom'), conditions: customConditionsSchema }),
  z.object({ ruleType: z.literal('segment'), conditions: segmentConditionsSchema }),
]);

export type KillSwitchConditions = z.infer<typeof killSwitchConditionsSchema>;
export type UserConditions = z.infer<typeof userConditionsSchema>;
export type RoleConditions = z.infer<typeof roleConditionsSchema>;
export type PercentageConditions = z.infer<typeof percentageConditionsSchema>;
export type CustomConditions = z.infer<typeof customConditionsSchema>;
export type SegmentConditions = z.infer<typeof segmentConditionsSchema>;
export type RuleConditions = z.infer<typeof ruleConditionsSchema>;
