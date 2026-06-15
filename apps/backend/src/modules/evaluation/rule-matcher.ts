import type { EvaluationContext, EvaluationReason, RuleType } from '@flagix/shared';
import { bucket } from './hash.util';

export interface RuleForMatching {
  id: string;
  ruleType: RuleType;
  priority: string;
  isEnabled: boolean;
  conditions: Record<string, unknown>;
}

export interface RuleMatcherStrategy {
  ruleType: RuleType;
  reason: EvaluationReason;
  matchFn: (rule: RuleForMatching, flagKey: string, context: EvaluationContext) => boolean;
}

export function matchesKillSwitch(
  rule: RuleForMatching,
  _flagKey?: string,
  _context?: EvaluationContext,
): boolean {
  return rule.ruleType === 'kill_switch' && rule.isEnabled;
}

export function matchesUserRule(
  rule: RuleForMatching,
  _flagKey: string,
  context: EvaluationContext,
): boolean {
  if (!context.userId) return false;
  const userIds = rule.conditions.userIds as string[] | undefined;
  if (!userIds || !Array.isArray(userIds)) return false;
  return userIds.includes(context.userId);
}

export function matchesRoleRule(
  rule: RuleForMatching,
  _flagKey: string,
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

export const RULE_MATCHER_REGISTRY: ReadonlyMap<RuleType, RuleMatcherStrategy> = new Map<
  RuleType,
  RuleMatcherStrategy
>([
  [
    'kill_switch',
    { ruleType: 'kill_switch', reason: 'KILL_SWITCH', matchFn: matchesKillSwitch },
  ],
  [
    'user',
    { ruleType: 'user', reason: 'USER_TARGETING', matchFn: matchesUserRule },
  ],
  [
    'role',
    { ruleType: 'role', reason: 'ROLE_TARGETING', matchFn: matchesRoleRule },
  ],
  [
    'percentage',
    {
      ruleType: 'percentage',
      reason: 'PERCENTAGE_ROLLOUT',
      matchFn: matchesPercentageRule,
    },
  ],
]);

export const MATCHER_TIERS: readonly RuleType[] = ['user', 'role', 'percentage'];

export function getMatcher(ruleType: RuleType): RuleMatcherStrategy | undefined {
  return RULE_MATCHER_REGISTRY.get(ruleType);
}
