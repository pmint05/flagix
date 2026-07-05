import type { EvaluationContext } from '@flagix/shared';
import type { LoadedFlag, LoadedFlagRule } from './safe-default.util';
import { getMatcher, getNestedValue, matchClause, evaluateSegment, segmentHasMissingAttributes } from './rule-matcher';
import { bucket } from './hash.util';

export interface SimulationClauseTrace {
  contextKey: string;
  provided: any;
  operator: string;
  expected: any;
  isMatched: boolean;
}

export interface SimulationRuleTrace {
  ruleId: string;
  ruleType: string;
  priority: string;
  isEnabled: boolean;
  isMatched: boolean;
  variationId: string | null;
  matchDetail?: {
    userId?: {
      provided?: string;
      expected?: string[];
      isMatched: boolean;
    };
    role?: {
      provided?: string;
      expected?: string[];
      isMatched: boolean;
    };
    custom?: SimulationClauseTrace[];
    percentage?: {
      userId?: string;
      hashKey?: string;
      bucketValue?: number;
      rollouts?: Array<{ variationId: string; percentage: number }>;
      matchedVariationId?: string;
      isMatched: boolean;
      explanation?: string;
      ranges?: Array<{ variationId: string; start: number; end: number }>;
    };
  };
}

export interface SimulationResult {
  flagKey: string;
  status: string;
  isEnabled: boolean;
  resolvedVariationId: string | null;
  resolvedVariationKey: string | null;
  resolvedVariationValue: any;
  reason: string;
  ruleTraces: SimulationRuleTrace[];
}

export function simulate(
  flag: LoadedFlag,
  context: EvaluationContext,
  options?: { bypassDraft?: boolean },
): SimulationResult {
  const result: SimulationResult = {
    flagKey: flag.key,
    status: flag.status,
    isEnabled: flag.isEnabled,
    resolvedVariationId: null,
    resolvedVariationKey: null,
    resolvedVariationValue: null,
    reason: 'UNKNOWN',
    ruleTraces: [],
  };

  if (flag.status === 'archived') {
    const offVariation = flag.offVariationId
      ? flag.variations.find((v) => v.id === flag.offVariationId)
      : flag.variations.find((v) => v.isDefault);
    result.resolvedVariationId = offVariation?.id || null;
    result.resolvedVariationKey = offVariation?.key || null;
    result.resolvedVariationValue = offVariation?.value ?? null;
    result.reason = 'FLAG_ARCHIVED';
    return result;
  }

  if (flag.status === 'draft' && !options?.bypassDraft) {
    const offVariation = flag.offVariationId
      ? flag.variations.find((v) => v.id === flag.offVariationId)
      : flag.variations.find((v) => v.isDefault);
    result.resolvedVariationId = offVariation?.id || null;
    result.resolvedVariationKey = offVariation?.key || null;
    result.resolvedVariationValue = offVariation?.value ?? null;
    result.reason = 'FLAG_DRAFT';
    return result;
  }

  if (!flag.isEnabled) {
    const offVariation = flag.offVariationId
      ? flag.variations.find((v) => v.id === flag.offVariationId)
      : flag.variations.find((v) => v.isDefault);
    result.resolvedVariationId = offVariation?.id || null;
    result.resolvedVariationKey = offVariation?.key || null;
    result.resolvedVariationValue = offVariation?.value ?? null;
    result.reason = 'FLAG_DISABLED';
    return result;
  }

  // Sort rules by priority ascending to ensure strict order evaluation
  const sortedRules = [...flag.rules].sort((a, b) =>
    a.priority.localeCompare(b.priority),
  );

  let matchedRuleIndex = -1;

  for (let i = 0; i < sortedRules.length; i++) {
    const rule = sortedRules[i];
    const trace: SimulationRuleTrace = {
      ruleId: rule.id,
      ruleType: rule.ruleType,
      priority: rule.priority,
      isEnabled: rule.isEnabled,
      isMatched: false,
      variationId: rule.variationId,
    };

    if (matchedRuleIndex !== -1) {
      // Already matched previous rule, this one is skipped
      result.ruleTraces.push(trace);
      continue;
    }

    if (!rule.isEnabled) {
      result.ruleTraces.push(trace);
      continue;
    }

    if (rule.ruleType === 'kill_switch') {
      trace.isMatched = true;
      matchedRuleIndex = i;
      result.ruleTraces.push(trace);
      const resolvedVarId = rule.variationId;
      const variation = flag.variations.find((v) => v.id === resolvedVarId);
      if (variation) {
        result.resolvedVariationId = variation.id;
        result.resolvedVariationKey = variation.key;
        result.resolvedVariationValue = variation.value;
        result.reason = 'KILL_SWITCH';
      }
      continue;
    }

    if (rule.ruleType === 'user') {
      const userIds = rule.conditions.userIds as string[] | undefined;
      const isMatched =
        !!context.userId &&
        Array.isArray(userIds) &&
        userIds.includes(context.userId);
      trace.isMatched = isMatched;
      trace.matchDetail = {
        userId: {
          provided: context.userId,
          expected: userIds || [],
          isMatched,
        },
      };
      if (isMatched) {
        matchedRuleIndex = i;
        const resolvedVarId = rule.variationId;
        const variation = flag.variations.find((v) => v.id === resolvedVarId);
        if (variation) {
          result.resolvedVariationId = variation.id;
          result.resolvedVariationKey = variation.key;
          result.resolvedVariationValue = variation.value;
          result.reason = 'RULE_MATCH';
        }
      }
      result.ruleTraces.push(trace);
      continue;
    }

    if (rule.ruleType === 'role') {
      const roles = rule.conditions.roles as string[] | undefined;
      const isMatched =
        !!context.role && Array.isArray(roles) && roles.includes(context.role);
      trace.isMatched = isMatched;
      trace.matchDetail = {
        role: {
          provided: context.role,
          expected: roles || [],
          isMatched,
        },
      };
      if (isMatched) {
        matchedRuleIndex = i;
        const resolvedVarId = rule.variationId;
        const variation = flag.variations.find((v) => v.id === resolvedVarId);
        if (variation) {
          result.resolvedVariationId = variation.id;
          result.resolvedVariationKey = variation.key;
          result.resolvedVariationValue = variation.value;
          result.reason = 'RULE_MATCH';
        }
      }
      result.ruleTraces.push(trace);
      continue;
    }

    if (rule.ruleType === 'percentage') {
      let isMatched = false;
      let matchedVariationId: string | undefined = undefined;
      let bucketValue = 0;
      const rollouts = rule.conditions.rollouts as
        | Array<{ variationId: string; percentage: number }>
        | undefined;
      const ranges: Array<{ variationId: string; start: number; end: number }> =
        [];
      let explanation = '';

      if (context.userId) {
        bucketValue = bucket(flag.key + rule.id, context.userId);
        if (rollouts && Array.isArray(rollouts)) {
          let cumulative = 0;
          for (const r of rollouts) {
            const start = cumulative;
            cumulative += r.percentage;
            ranges.push({ variationId: r.variationId, start, end: cumulative });
            if (bucketValue < cumulative && !isMatched) {
              isMatched = true;
              matchedVariationId = r.variationId;
            }
          }

          if (isMatched) {
            const range = ranges.find(
              (rg) => rg.variationId === matchedVariationId,
            );
            const varName =
              flag.variations.find((v) => v.id === matchedVariationId)?.key ||
              matchedVariationId;
            explanation = `User's bucket value ${bucketValue}% falls within the ${varName} group range [${range?.start}% - ${range?.end}%).`;
          } else {
            explanation = `User's bucket value ${bucketValue}% is outside all rollout group ranges (total configured: ${cumulative}%). The rule is not matched.`;
          }
        } else {
          // Fallback legacy percentage format
          const percentage = rule.conditions.percentage as number | undefined;
          if (percentage !== undefined && typeof percentage === 'number') {
            ranges.push({
              variationId: rule.variationId || '',
              start: 0,
              end: percentage,
            });
            if (bucketValue < percentage) {
              isMatched = true;
              matchedVariationId = rule.variationId || undefined;
              explanation = `User's bucket value ${bucketValue}% is less than the legacy threshold ${percentage}%.`;
            } else {
              explanation = `User's bucket value ${bucketValue}% is greater than or equal to the legacy threshold ${percentage}%.`;
            }
          }
        }
      } else {
        explanation = `Missing userId in evaluation context. Percentage rollout cannot be computed.`;
      }

      trace.isMatched = isMatched;
      trace.matchDetail = {
        percentage: {
          userId: context.userId,
          hashKey: flag.key + rule.id,
          bucketValue,
          rollouts: rollouts || [],
          matchedVariationId,
          isMatched,
          explanation,
          ranges,
        },
      };

      if (isMatched) {
        matchedRuleIndex = i;
        const resolvedVarId = matchedVariationId || rule.variationId;
        const variation = flag.variations.find((v) => v.id === resolvedVarId);
        if (variation) {
          result.resolvedVariationId = variation.id;
          result.resolvedVariationKey = variation.key;
          result.resolvedVariationValue = variation.value;
          result.reason = 'RULE_MATCH';
        }
      }
      result.ruleTraces.push(trace);
      continue;
    }

    if (rule.ruleType === 'segment') {
      const segmentIds = rule.conditions.segmentIds as string[] | undefined;
      const operator = rule.conditions.operator as 'in' | 'not_in' | undefined;

      let isMatched = false;
      const detail: Array<{ segmentId: string; segmentName?: string; isMatched: boolean }> = [];

      if (segmentIds && Array.isArray(segmentIds) && operator && flag.segments) {
        const isAnySegmentMatched = segmentIds.some((id) => {
          const segment = flag.segments![id];
          const matches = segment ? evaluateSegment(segment, context) : false;
          detail.push({
            segmentId: id,
            segmentName: segment?.key,
            isMatched: matches,
          });
          return matches;
        });

        if (operator === 'not_in' && !isAnySegmentMatched) {
          const anySegmentIndeterminate = segmentIds.some((id) => {
            const segment = flag.segments![id];
            return segment ? segmentHasMissingAttributes(segment, context) : false;
          });
          isMatched = !anySegmentIndeterminate;
        } else {
          isMatched = operator === 'in' ? isAnySegmentMatched : !isAnySegmentMatched;
        }
      }

      trace.isMatched = isMatched;
      trace.matchDetail = {
        segment: {
          operator,
          segments: detail,
        },
      } as any;

      if (isMatched) {
        matchedRuleIndex = i;
        const resolvedVarId = rule.variationId;
        const variation = flag.variations.find((v) => v.id === resolvedVarId);
        if (variation) {
          result.resolvedVariationId = variation.id;
          result.resolvedVariationKey = variation.key;
          result.resolvedVariationValue = variation.value;
          result.reason = 'RULE_MATCH';
        }
      }
      result.ruleTraces.push(trace);
      continue;
    }

    if (rule.ruleType === 'custom') {
      const customConditions = (
        rule.conditions as Record<string, unknown>
      )?.conditions as
        | Array<{
            contextKey: string;
            type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'semver' | 'date';
            operator: string;
            value?: any;
            values?: any[];
          }>
        | undefined;

      if (!customConditions || !Array.isArray(customConditions)) {
        trace.isMatched = false;
        result.ruleTraces.push(trace);
        continue;
      }

      const clausesTraces: SimulationClauseTrace[] = [];
      let allMatched = true;

      for (const clause of customConditions) {
        const { contextKey, operator } = clause;
        let contextValue: any = undefined;
        if (contextKey === 'userId') {
          contextValue = context.userId;
        } else if (contextKey === 'role') {
          contextValue = context.role;
        } else {
          contextValue = getNestedValue(context.attributes, contextKey);
        }

        const clauseValue =
          clause.value !== undefined && clause.value !== null
            ? clause.value
            : clause.values;
        const clauseMatched = matchClause(
          clause.type,
          operator,
          contextValue,
          clauseValue,
        );

        if (!clauseMatched) {
          allMatched = false;
        }

        clausesTraces.push({
          contextKey,
          provided: contextValue ?? null,
          operator,
          expected: clauseValue,
          isMatched: clauseMatched,
        });
      }

      trace.isMatched = allMatched;
      trace.matchDetail = { custom: clausesTraces };

      if (allMatched && customConditions.length > 0) {
        matchedRuleIndex = i;
        const resolvedVarId = rule.variationId;
        const variation = flag.variations.find((v) => v.id === resolvedVarId);
        if (variation) {
          result.resolvedVariationId = variation.id;
          result.resolvedVariationKey = variation.key;
          result.resolvedVariationValue = variation.value;
          result.reason = 'RULE_MATCH';
        }
      }
      result.ruleTraces.push(trace);
      continue;
    }
  }

  if (matchedRuleIndex === -1) {
    // Resolve default fallback
    let defaultVariation = flag.defaultVariationId
      ? flag.variations.find((v) => v.id === flag.defaultVariationId)
      : undefined;
    if (!defaultVariation) {
      defaultVariation = flag.variations.find((v) => v.isDefault);
    }
    if (defaultVariation) {
      result.resolvedVariationId = defaultVariation.id;
      result.resolvedVariationKey = defaultVariation.key;
      result.resolvedVariationValue = defaultVariation.value;
      result.reason = 'DEFAULT';
    } else {
      result.reason = 'NO_VARIATION';
    }
  }

  return result;
}
