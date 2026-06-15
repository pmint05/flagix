import type {
  EvaluationContext,
  EvaluationResult,
  EvaluationReason,
  RuleType,
} from '@flagix/shared';
import type { LoadedFlag } from './safe-default.util';
import { buildSafeDefault } from './safe-default.util';
import {
  matchesUserRule,
  matchesRoleRule,
  matchesPercentageRule,
  type RuleForMatching,
} from './rule-matcher';

const RULE_TYPE_TO_REASON: Record<RuleType, EvaluationReason> = {
  kill_switch: 'KILL_SWITCH',
  user: 'USER_TARGETING',
  role: 'ROLE_TARGETING',
  percentage: 'PERCENTAGE_ROLLOUT',
};

export function evaluate(
  flag: LoadedFlag,
  context: EvaluationContext,
): EvaluationResult {
  if (flag.status === 'archived') {
    return buildSafeDefault(flag, flag.key, 'FLAG_ARCHIVED');
  }

  if (flag.status === 'draft') {
    return buildSafeDefault(flag, flag.key, 'FLAG_DRAFT');
  }

  if (!flag.isEnabled) {
    return buildSafeDefault(flag, flag.key, 'FLAG_DISABLED');
  }

  const sortedRules = [...flag.rules].sort((a, b) =>
    a.priority.localeCompare(b.priority),
  );

  const killSwitchRule = sortedRules.find(
    (r) => r.ruleType === 'kill_switch' && r.isEnabled,
  );
  if (killSwitchRule) {
    const variation = flag.variations.find(
      (v) => v.id === killSwitchRule.variationId,
    );
    if (variation) {
      return {
        flagKey: flag.key,
        enabled: false,
        variationKey: variation.key,
        resolvedValue: variation.value,
        evaluationReason: 'KILL_SWITCH',
      };
    }
  }

  const nonKillSwitchRules = sortedRules.filter(
    (r) => r.ruleType !== 'kill_switch' && r.isEnabled,
  );

  for (const rule of nonKillSwitchRules) {
    const matched = matchRule(rule, flag.key, context);
    if (!matched) continue;

    const reason = RULE_TYPE_TO_REASON[rule.ruleType];
    const variation = flag.variations.find((v) => v.id === rule.variationId);
    if (variation) {
      return {
        flagKey: flag.key,
        enabled: true,
        variationKey: variation.key,
        resolvedValue: variation.value,
        evaluationReason: reason,
      };
    }
  }

  const defaultVariation = flag.variations.find((v) => v.isDefault);
  if (defaultVariation) {
    return {
      flagKey: flag.key,
      enabled: true,
      variationKey: defaultVariation.key,
      resolvedValue: defaultVariation.value,
      evaluationReason: 'DEFAULT',
    };
  }

  return buildSafeDefault(flag, flag.key, 'EVALUATION_ERROR');
}

function matchRule(
  rule: RuleForMatching,
  flagKey: string,
  context: EvaluationContext,
): boolean {
  switch (rule.ruleType) {
    case 'user':
      return matchesUserRule(rule, context);
    case 'role':
      return matchesRoleRule(rule, context);
    case 'percentage':
      return matchesPercentageRule(rule, flagKey, context);
    default:
      return false;
  }
}
