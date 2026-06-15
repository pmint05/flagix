import type { EvaluationContext, RuleType } from '@flagix/shared';
import { bucket } from './hash.util';

export interface RuleForMatching {
  id: string;
  ruleType: RuleType;
  priority: string;
  isEnabled: boolean;
  conditions: Record<string, unknown>;
}

export function matchesKillSwitch(rule: RuleForMatching): boolean {
  return rule.ruleType === 'kill_switch' && rule.isEnabled;
}

export function matchesUserRule(
  rule: RuleForMatching,
  context: EvaluationContext,
): boolean {
  if (!context.userId) return false;
  const userIds = rule.conditions.userIds as string[] | undefined;
  if (!userIds || !Array.isArray(userIds)) return false;
  return userIds.includes(context.userId);
}

export function matchesRoleRule(
  rule: RuleForMatching,
  context: EvaluationContext,
): boolean {
  if (!context.role) return false;
  const roles = rule.conditions.roles as string[] | undefined;
  if (!roles || !Array.isArray(roles)) return false;
  return roles.includes(context.role);
}

export function matchesPercentageRule(
  rule: RuleForMatching,
  flagKey: string,
  context: EvaluationContext,
): boolean {
  if (!context.userId) return false;
  const percentage = rule.conditions.percentage as number | undefined;
  if (percentage === undefined || typeof percentage !== 'number') return false;
  return bucket(flagKey, context.userId) < percentage;
}
