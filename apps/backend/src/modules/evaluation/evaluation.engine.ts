import type { EvaluationContext, EvaluationResult, RuleType } from '@flagix/shared';
import type { LoadedFlag } from './safe-default.util';
import { buildSafeDefault } from './safe-default.util';
import { getMatcher, MATCHER_TIERS, type RuleForMatching } from './rule-matcher';

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

  const killSwitchMatcher = getMatcher('kill_switch');
  const killSwitchRule = flag.rules.find(
    (r) => r.ruleType === 'kill_switch' && r.isEnabled && killSwitchMatcher?.matchFn(r, flag.key, context),
  );

  if (killSwitchRule) {
    const variation = flag.variations.find((v) => v.id === killSwitchRule.variationId);
    return {
      flagKey: flag.key,
      enabled: false,
      variationKey: variation?.key ?? '',
      resolvedValue: variation?.value ?? false,
      evaluationReason: 'KILL_SWITCH',
    };
  }

  for (const tier of MATCHER_TIERS) {
    const result = evaluateTier(tier, flag, context);
    if (result) return result;
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

function evaluateTier(
  ruleType: RuleType,
  flag: LoadedFlag,
  context: EvaluationContext,
): EvaluationResult | null {
  const matcher = getMatcher(ruleType);
  if (!matcher) return null;

  const tierRules = flag.rules.filter((r) => r.ruleType === ruleType && r.isEnabled);

  for (const rule of tierRules) {
    if (!matcher.matchFn(rule as RuleForMatching, flag.key, context)) continue;

    const variation = flag.variations.find((v) => v.id === rule.variationId);
    if (variation) {
      return {
        flagKey: flag.key,
        enabled: true,
        variationKey: variation.key,
        resolvedValue: variation.value,
        evaluationReason: matcher.reason,
      };
    }
  }

  return null;
}
