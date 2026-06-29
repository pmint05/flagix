import type { EvaluationContext, EvaluationResult } from '@flagix/shared';
import type { LoadedFlag } from './safe-default.util';
import { buildSafeDefault } from './safe-default.util';
import { getMatcher } from './rule-matcher';

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

  // Sort rules by priority ascending to ensure strict order evaluation
  const sortedRules = [...flag.rules].sort((a, b) =>
    a.priority.localeCompare(b.priority),
  );

  for (const rule of sortedRules) {
    if (!rule.isEnabled) continue;
    const matcher = getMatcher(rule.ruleType);
    if (!matcher) continue;

    const matchResult = matcher.matchFn(rule, flag.key, context);
    if (matchResult.isMatched) {
      const resolvedVarId = matchResult.variationId || rule.variationId;
      const variation = flag.variations.find((v) => v.id === resolvedVarId);

      const isEnabled = rule.ruleType !== 'kill_switch';

      if (variation) {
        return {
          flagKey: flag.key,
          enabled: isEnabled,
          variationKey: variation.key,
          resolvedValue: variation.value,
          evaluationReason: matcher.reason,
        };
      }
    }
  }

  // Resolve environment-specific defaultVariationId first, fall back to global default variation
  let defaultVariation = flag.defaultVariationId
    ? flag.variations.find((v) => v.id === flag.defaultVariationId)
    : undefined;
  if (!defaultVariation) {
    defaultVariation = flag.variations.find((v) => v.isDefault);
  }

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
