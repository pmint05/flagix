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

  for (const rule of flag.rules) {
    if (!rule.isEnabled) continue;
    const matcher = getMatcher(rule.ruleType);
    if (!matcher) continue;

    const matchResult = matcher.matchFn(rule, flag.key, context, flag.segments);
    if (matchResult.isMatched) {
      const resolvedVarId = matchResult.variationId || rule.variationId;
      const variation = flag.variations.find((v) => v.id === resolvedVarId);

      const isEnabled = rule.ruleType !== 'kill_switch';

      if (variation) {
        const result = {
          flagKey: flag.key,
          enabled: isEnabled,
          variationKey: variation.key,
          resolvedValue: variation.value,
          evaluationReason: matcher.reason,
        };
        Object.defineProperty(result, 'featureFlagId', { value: flag.id, enumerable: false });
        Object.defineProperty(result, 'variationId', { value: variation.id, enumerable: false });
        return result as any;
      }
    }
  }

  let defaultVariation = flag.defaultVariationId
    ? flag.variations.find((v) => v.id === flag.defaultVariationId)
    : undefined;

  if (defaultVariation) {
    const result = {
      flagKey: flag.key,
      enabled: true,
      variationKey: defaultVariation.key,
      resolvedValue: defaultVariation.value,
      evaluationReason: 'DEFAULT',
    };
    Object.defineProperty(result, 'featureFlagId', { value: flag.id, enumerable: false });
    Object.defineProperty(result, 'variationId', { value: defaultVariation.id, enumerable: false });
    return result as any;
  }

  return buildSafeDefault(flag, flag.key, 'EVALUATION_ERROR');
}
