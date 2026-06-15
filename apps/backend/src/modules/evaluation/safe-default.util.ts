import type {
  EvaluationResult,
  EvaluationReason,
  VariationValue,
  FlagType,
  FlagStatus,
  RuleType,
} from '@flagix/shared';

export interface LoadedFlagVariation {
  id: string;
  key: string;
  value: VariationValue;
  isDefault: boolean;
}

export interface LoadedFlagRule {
  id: string;
  ruleType: RuleType;
  priority: string;
  variationId: string;
  conditions: Record<string, unknown>;
  isEnabled: boolean;
}

export interface LoadedFlag {
  id: string;
  key: string;
  name: string;
  flagType: FlagType;
  status: FlagStatus;
  isEnabled: boolean;
  version: number;
  variations: LoadedFlagVariation[];
  rules: LoadedFlagRule[];
}

export function buildSafeDefault(
  flag: LoadedFlag | null,
  flagKey: string,
  reason: EvaluationReason,
): EvaluationResult {
  if (!flag) {
    return {
      flagKey,
      enabled: false,
      variationKey: '',
      resolvedValue: false,
      evaluationReason: reason,
    };
  }

  const defaultVariation = flag.variations.find((v) => v.isDefault);
  if (!defaultVariation) {
    return {
      flagKey,
      enabled: false,
      variationKey: '',
      resolvedValue: false,
      evaluationReason: reason,
    };
  }

  return {
    flagKey,
    enabled: false,
    variationKey: defaultVariation.key,
    resolvedValue: defaultVariation.value,
    evaluationReason: reason,
  };
}
