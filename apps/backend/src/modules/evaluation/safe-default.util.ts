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
  variationId: string | null;
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
  offVariationId?: string | null;
  defaultVariationId?: string | null;
  variations: LoadedFlagVariation[];
  rules: LoadedFlagRule[];
  visibility: 'all' | 'client_only' | 'server_only';
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

  let variation = flag.offVariationId
    ? flag.variations.find((v) => v.id === flag.offVariationId)
    : undefined;
  if (!variation && flag.defaultVariationId) {
    variation = flag.variations.find((v) => v.id === flag.defaultVariationId);
  }

  if (!variation) {
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
    variationKey: variation.key,
    resolvedValue: variation.value,
    evaluationReason: reason,
  };
}
