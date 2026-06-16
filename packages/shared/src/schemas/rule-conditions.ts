import { z } from 'zod';

export const killSwitchConditionsSchema = z.object({});

export const userConditionsSchema = z.object({
  userIds: z.array(z.string().min(1)).min(1),
});

export const roleConditionsSchema = z.object({
  roles: z.array(z.string().min(1)).min(1),
});

export const percentageConditionsSchema = z.object({
  percentage: z.number().int().min(0).max(100),
});

export const ruleConditionsSchema = z.discriminatedUnion('ruleType', [
  z.object({ ruleType: z.literal('kill_switch'), conditions: killSwitchConditionsSchema }),
  z.object({ ruleType: z.literal('user'), conditions: userConditionsSchema }),
  z.object({ ruleType: z.literal('role'), conditions: roleConditionsSchema }),
  z.object({ ruleType: z.literal('percentage'), conditions: percentageConditionsSchema }),
]);

export type KillSwitchConditions = z.infer<typeof killSwitchConditionsSchema>;
export type UserConditions = z.infer<typeof userConditionsSchema>;
export type RoleConditions = z.infer<typeof roleConditionsSchema>;
export type PercentageConditions = z.infer<typeof percentageConditionsSchema>;
export type RuleConditions = z.infer<typeof ruleConditionsSchema>;
