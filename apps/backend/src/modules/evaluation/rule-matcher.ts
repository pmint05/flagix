import type {
  EvaluationContext,
  EvaluationReason,
  RuleType,
} from '@flagix/shared';
import { bucket } from './hash.util';

export interface RuleForMatching {
  id: string;
  ruleType: RuleType;
  priority: string;
  isEnabled: boolean;
  variationId: string | null;
  conditions: Record<string, unknown>;
}

export interface MatchResult {
  isMatched: boolean;
  variationId?: string;
}

export interface RuleMatcherStrategy {
  ruleType: RuleType;
  reason: EvaluationReason;
  matchFn: (
    rule: RuleForMatching,
    flagKey: string,
    context: EvaluationContext,
  ) => MatchResult;
}

export function matchesKillSwitch(
  rule: RuleForMatching,
  _flagKey?: string,
  _context?: EvaluationContext,
): MatchResult {
  if (rule.ruleType === 'kill_switch' && rule.isEnabled) {
    return { isMatched: true, variationId: rule.variationId || undefined };
  }
  return { isMatched: false };
}

export function matchesUserRule(
  rule: RuleForMatching,
  _flagKey: string,
  context: EvaluationContext,
): MatchResult {
  if (!context.userId) return { isMatched: false };
  const userIds = rule.conditions.userIds as string[] | undefined;
  if (!userIds || !Array.isArray(userIds)) return { isMatched: false };
  if (userIds.includes(context.userId)) {
    return { isMatched: true, variationId: rule.variationId || undefined };
  }
  return { isMatched: false };
}

export function matchesRoleRule(
  rule: RuleForMatching,
  _flagKey: string,
  context: EvaluationContext,
): MatchResult {
  if (!context.role) return { isMatched: false };
  const roles = rule.conditions.roles as string[] | undefined;
  if (!roles || !Array.isArray(roles)) return { isMatched: false };
  if (roles.includes(context.role)) {
    return { isMatched: true, variationId: rule.variationId || undefined };
  }
  return { isMatched: false };
}

export function matchesPercentageRule(
  rule: RuleForMatching,
  flagKey: string,
  context: EvaluationContext,
): MatchResult {
  if (!context.userId) return { isMatched: false };
  
  // Use salted hash key: flagKey + ruleId + userId
  const bucketValue = bucket(flagKey + rule.id, context.userId);

  // Check for the new rollouts array structure
  const rollouts = rule.conditions.rollouts as Array<{ variationId: string, percentage: number }> | undefined;
  if (rollouts && Array.isArray(rollouts)) {
    let cumulative = 0;
    for (const r of rollouts) {
      cumulative += r.percentage;
      if (bucketValue < cumulative) {
        return { isMatched: true, variationId: r.variationId };
      }
    }
    // If it falls outside the cumulative rollout ranges, it continues to next rules
    return { isMatched: false };
  }

  // Fallback for legacy conditions.percentage format
  const percentage = rule.conditions.percentage as number | undefined;
  if (percentage !== undefined && typeof percentage === 'number') {
    if (bucketValue < percentage) {
      return { isMatched: true, variationId: rule.variationId || undefined };
    }
  }

  return { isMatched: false };
}

export function matchesCustomRule(
  rule: RuleForMatching,
  _flagKey: string,
  context: EvaluationContext,
): MatchResult {
  const customConditions = rule.conditions.conditions as Array<{
    contextKey: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    operator: string;
    value?: any;
    values?: any[];
  }> | undefined;

  if (!customConditions || !Array.isArray(customConditions)) {
    return { isMatched: false };
  }

  for (const clause of customConditions) {
    const { contextKey, operator } = clause;
    
    let contextValue: any = undefined;
    if (contextKey === 'userId') {
      contextValue = context.userId;
    } else if (contextKey === 'role') {
      contextValue = context.role;
    } else if (context.attributes && contextKey in context.attributes) {
      contextValue = context.attributes[contextKey];
    }

    if (contextValue === undefined) {
      return { isMatched: false };
    }

    let matched = false;
    const clauseValue = clause.value !== undefined ? clause.value : clause.values;

    switch (operator) {
      case 'equals':
        matched = String(contextValue) === String(clauseValue);
        break;
      case 'not_equals':
        matched = String(contextValue) !== String(clauseValue);
        break;
      case 'greater_than':
        matched = Number(contextValue) > Number(clauseValue);
        break;
      case 'less_than':
        matched = Number(contextValue) < Number(clauseValue);
        break;
      case 'contains':
        if (typeof contextValue === 'string') {
          matched = contextValue.includes(String(clauseValue));
        } else if (Array.isArray(contextValue)) {
          matched = contextValue.includes(clauseValue);
        }
        break;
      case 'not_contains':
        if (typeof contextValue === 'string') {
          matched = !contextValue.includes(String(clauseValue));
        } else if (Array.isArray(contextValue)) {
          matched = !contextValue.includes(clauseValue);
        }
        break;
      case 'is_one_of':
      case 'in':
        if (Array.isArray(clauseValue)) {
          matched = clauseValue.map(String).includes(String(contextValue));
        }
        break;
      case 'is_not_one_of':
      case 'not_in':
        if (Array.isArray(clauseValue)) {
          matched = !clauseValue.map(String).includes(String(contextValue));
        }
        break;
      default:
        matched = false;
    }

    if (!matched) {
      return { isMatched: false };
    }
  }

  return { isMatched: true, variationId: rule.variationId || undefined };
}

export const RULE_MATCHER_REGISTRY: ReadonlyMap<RuleType, RuleMatcherStrategy> =
  new Map<RuleType, RuleMatcherStrategy>([
    [
      'kill_switch',
      {
        ruleType: 'kill_switch',
        reason: 'KILL_SWITCH',
        matchFn: matchesKillSwitch,
      },
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
    [
      'custom',
      {
        ruleType: 'custom',
        reason: 'CUSTOM_RULE',
        matchFn: matchesCustomRule,
      },
    ],
  ]);

export const MATCHER_TIERS: readonly RuleType[] = [
  'user',
  'role',
  'custom',
  'percentage',
];

export function getMatcher(
  ruleType: RuleType,
): RuleMatcherStrategy | undefined {
  return RULE_MATCHER_REGISTRY.get(ruleType);
}
