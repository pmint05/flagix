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
    segments?: Record<string, { id: string; key: string; conditions: any }>,
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
  const rollouts = rule.conditions.rollouts as
    | Array<{ variationId: string; percentage: number }>
    | undefined;
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

export function getNestedValue(obj: any, path: string): any {
  if (obj == null) return undefined;
  const parts = path.split(/(?<!\\)\./).map((p) => p.replace(/\\\./g, '.'));
  let current = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') {
      return undefined;
    }
    current = current[part];
  }
  return current;
}

function isDeepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!isDeepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!isDeepEqual(a[key], b[key])) return false;
  }
  return true;
}

function parseSemver(v: string) {
  if (v == null) return null;
  const match = String(v).trim().match(/^v?(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.-]+))?(?:\+([a-zA-Z0-9.-]+))?$/);
  if (!match) return null;
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4] || '',
  };
}

function compareSemver(v1: string, v2: string): number {
  const p1 = parseSemver(v1);
  const p2 = parseSemver(v2);
  if (!p1 && !p2) return String(v1).localeCompare(String(v2));
  if (!p1) return -1;
  if (!p2) return 1;

  if (p1.major !== p2.major) return p1.major - p2.major;
  if (p1.minor !== p2.minor) return p1.minor - p2.minor;
  if (p1.patch !== p2.patch) return p1.patch - p2.patch;

  if (!p1.prerelease && p2.prerelease) return 1;
  if (p1.prerelease && !p2.prerelease) return -1;
  if (!p1.prerelease && !p2.prerelease) return 0;

  return p1.prerelease.localeCompare(p2.prerelease);
}

export function matchClause(
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'semver' | 'date',
  operator: string,
  contextValue: any,
  clauseValue: any,
): boolean {
  if (contextValue === undefined) return false;

  switch (type) {
    case 'string': {
      const strVal = String(contextValue);
      switch (operator) {
        case 'equals':
          return strVal === String(clauseValue);
        case 'not_equals':
          return strVal !== String(clauseValue);
        case 'is_one_of':
        case 'in':
          return (
            Array.isArray(clauseValue) &&
            clauseValue.map(String).includes(strVal)
          );
        case 'is_not_one_of':
        case 'not_in':
          return (
            Array.isArray(clauseValue) &&
            !clauseValue.map(String).includes(strVal)
          );
        case 'contains':
          return strVal.includes(String(clauseValue));
        case 'not_contains':
          return !strVal.includes(String(clauseValue));
        case 'starts_with':
          return strVal.startsWith(String(clauseValue));
        case 'ends_with':
          return strVal.endsWith(String(clauseValue));
        case 'matches_regex':
          try {
            return new RegExp(String(clauseValue)).test(strVal);
          } catch {
            return false;
          }
        default:
          return false;
      }
    }

    case 'number': {
      const numVal = Number(contextValue);
      const clauseNum = Number(clauseValue);
      switch (operator) {
        case 'equals':
          return numVal === clauseNum;
        case 'not_equals':
          return numVal !== clauseNum;
        case 'gt':
        case 'greater_than':
          return numVal > clauseNum;
        case 'gte':
          return numVal >= clauseNum;
        case 'lt':
        case 'less_than':
          return numVal < clauseNum;
        case 'lte':
          return numVal <= clauseNum;
        case 'is_one_of':
        case 'in':
          return (
            Array.isArray(clauseValue) &&
            clauseValue.map(Number).includes(numVal)
          );
        case 'is_not_one_of':
        case 'not_in':
          return (
            Array.isArray(clauseValue) &&
            !clauseValue.map(Number).includes(numVal)
          );
        case 'between':
          return (
            Array.isArray(clauseValue) &&
            clauseValue.length === 2 &&
            numVal >= Number(clauseValue[0]) &&
            numVal <= Number(clauseValue[1])
          );
        default:
          return false;
      }
    }

    case 'boolean': {
      const boolVal = String(contextValue) === 'true' || contextValue === true;
      const clauseBool = String(clauseValue) === 'true' || clauseValue === true;
      switch (operator) {
        case 'equals':
          return boolVal === clauseBool;
        case 'not_equals':
          return boolVal !== clauseBool;
        default:
          return false;
      }
    }

    case 'object': {
      switch (operator) {
        case 'has_key':
          return (
            contextValue != null &&
            typeof contextValue === 'object' &&
            String(clauseValue) in contextValue
          );
        case 'not_has_key':
          return (
            contextValue == null ||
            typeof contextValue !== 'object' ||
            !(String(clauseValue) in contextValue)
          );
        case 'equals_json':
          try {
            const parsedClause =
              typeof clauseValue === 'string'
                ? JSON.parse(clauseValue)
                : clauseValue;
            return isDeepEqual(contextValue, parsedClause);
          } catch {
            return false;
          }
        default:
          return false;
      }
    }

    case 'array': {
      if (!Array.isArray(contextValue)) return false;
      switch (operator) {
        case 'contains':
          return contextValue.map(String).includes(String(clauseValue));
        case 'not_contains':
          return !contextValue.map(String).includes(String(clauseValue));
        case 'contains_any':
          return (
            Array.isArray(clauseValue) &&
            clauseValue.some((cv) =>
              contextValue.map(String).includes(String(cv)),
            )
          );
        case 'contains_all':
          return (
            Array.isArray(clauseValue) &&
            clauseValue.every((cv) =>
              contextValue.map(String).includes(String(cv)),
            )
          );
        case 'is_empty':
          return contextValue.length === 0;
        case 'is_not_empty':
          return contextValue.length > 0;
        default:
          return false;
      }
    }

    case 'semver': {
      const semStr = String(contextValue);
      switch (operator) {
        case 'equals':
          return compareSemver(semStr, String(clauseValue)) === 0;
        case 'not_equals':
          return compareSemver(semStr, String(clauseValue)) !== 0;
        case 'gt':
        case 'greater_than':
          return compareSemver(semStr, String(clauseValue)) > 0;
        case 'gte':
          return compareSemver(semStr, String(clauseValue)) >= 0;
        case 'lt':
        case 'less_than':
          return compareSemver(semStr, String(clauseValue)) < 0;
        case 'lte':
          return compareSemver(semStr, String(clauseValue)) <= 0;
        case 'in':
        case 'is_one_of':
          return (
            Array.isArray(clauseValue) &&
            clauseValue.some((cv) => compareSemver(semStr, String(cv)) === 0)
          );
        case 'not_in':
        case 'is_not_one_of':
          return (
            Array.isArray(clauseValue) &&
            !clauseValue.some((cv) => compareSemver(semStr, String(cv)) === 0)
          );
        case 'between':
          return (
            Array.isArray(clauseValue) &&
            clauseValue.length === 2 &&
            compareSemver(semStr, String(clauseValue[0])) >= 0 &&
            compareSemver(semStr, String(clauseValue[1])) <= 0
          );
        default:
          return false;
      }
    }

    case 'date': {
      const dateVal = new Date(contextValue).getTime();
      if (isNaN(dateVal)) return false;
      switch (operator) {
        case 'after':
        case 'greater_than':
        case 'gt':
          return dateVal > new Date(clauseValue).getTime();
        case 'before':
        case 'less_than':
        case 'lt':
          return dateVal < new Date(clauseValue).getTime();
        case 'between':
          return (
            Array.isArray(clauseValue) &&
            clauseValue.length === 2 &&
            dateVal >= new Date(clauseValue[0]).getTime() &&
            dateVal <= new Date(clauseValue[1]).getTime()
          );
        default:
          return false;
      }
    }

    default:
      return false;
  }
}

export function matchesCustomRule(
  rule: RuleForMatching,
  _flagKey: string,
  context: EvaluationContext,
): MatchResult {
  const customConditions = (rule.conditions as any)?.conditions as any[] | undefined;

  if (!customConditions) {
    return { isMatched: false };
  }

  for (const clause of customConditions) {
    const { contextKey, operator, type } = clause;

    let contextValue: any = undefined;
    if (contextKey === 'userId') {
      contextValue = context.userId;
    } else if (contextKey === 'role') {
      contextValue = context.role;
    } else {
      contextValue = getNestedValue(context.attributes, contextKey);
    }

    if (contextValue === undefined) {
      return { isMatched: false };
    }

    // "between" operator always uses the values array; for others prefer value, fallback to values
    const clauseValue =
      operator === 'between' && Array.isArray(clause.values)
        ? clause.values
        : clause.value !== undefined && clause.value !== null
          ? clause.value
          : clause.values;

    const matched = matchClause(type, operator, contextValue, clauseValue);

    if (!matched) {
      return { isMatched: false };
    }
  }

  return { isMatched: true, variationId: rule.variationId || undefined };
}

export function evaluateSegment(
  segment: { conditions: any },
  context: EvaluationContext,
): boolean {
  const conditions = Array.isArray(segment?.conditions) ? segment.conditions : undefined;
  if (!conditions) return false;

  for (const clause of conditions) {
    // conditionType discriminator — defaults to "custom" for backward compat
    const conditionType: string = clause.conditionType ?? 'custom';

    // ── User targeting ───────────────────────────────────────────────────────
    if (conditionType === 'user') {
      const userIds = clause.userIds as string[] | undefined;
      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return false;
      }
      if (!context.userId || !userIds.includes(context.userId)) {
        return false;
      }
      continue;
    }

    // ── Role targeting ───────────────────────────────────────────────────────
    if (conditionType === 'role') {
      const roles = clause.roles as string[] | undefined;
      if (!roles || !Array.isArray(roles) || roles.length === 0) {
        return false;
      }
      if (!context.role || !roles.includes(context.role)) {
        return false;
      }
      continue;
    }

    // ── Custom attribute condition (conditionType === "custom" or legacy) ────
    const { contextKey, operator, type } = clause;

    let contextValue: any = undefined;
    if (contextKey === 'userId') {
      contextValue = context.userId;
    } else if (contextKey === 'role') {
      contextValue = context.role;
    } else {
      contextValue = getNestedValue(context.attributes, contextKey);
    }

    if (contextValue === undefined) {
      return false;
    }

    // "between" operator always uses the values array; for others prefer value, fallback to values
    const clauseValue =
      operator === 'between' && Array.isArray(clause.values)
        ? clause.values
        : clause.value !== undefined && clause.value !== null
          ? clause.value
          : clause.values;

    const matched = matchClause(type, operator, contextValue, clauseValue);
    if (!matched) {
      return false;
    }
  }

  return true;
}


export function segmentHasMissingAttributes(
  segment: { conditions: any },
  context: EvaluationContext,
): boolean {
  const conditions = Array.isArray(segment?.conditions) ? segment.conditions : undefined;
  if (!conditions) return false;

  for (const clause of conditions) {
    const conditionType: string = clause.conditionType ?? 'custom';

    if (conditionType === 'user' || conditionType === 'role') continue;

    const { contextKey } = clause;

    let contextValue: any = undefined;
    if (contextKey === 'userId') {
      contextValue = context.userId;
    } else if (contextKey === 'role') {
      contextValue = context.role;
    } else {
      contextValue = getNestedValue(context.attributes, contextKey);
    }

    if (contextValue === undefined || contextValue === null) {
      return true;
    }
  }

  return false;
}

export function matchesSegmentRule(
  rule: RuleForMatching,
  _flagKey: string,
  context: EvaluationContext,
  segments?: Record<string, { id: string; key: string; conditions: any }>,
): MatchResult {
  const segmentIds = rule.conditions.segmentIds as string[] | undefined;
  const operator = rule.conditions.operator as 'in' | 'not_in' | undefined;

  if (!segmentIds || !Array.isArray(segmentIds) || !operator || !segments) {
    return { isMatched: false };
  }

  const isAnySegmentMatched = segmentIds.some((id) => {
    const segment = segments[id];
    return segment ? evaluateSegment(segment, context) : false;
  });

  if (operator === 'not_in' && !isAnySegmentMatched) {
    const anySegmentIndeterminate = segmentIds.some((id) => {
      const segment = segments[id];
      return segment ? segmentHasMissingAttributes(segment, context) : false;
    });
    if (anySegmentIndeterminate) {
      return { isMatched: false };
    }
  }

  const isMatched = operator === 'in' ? isAnySegmentMatched : !isAnySegmentMatched;

  return { isMatched, variationId: rule.variationId || undefined };
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
    [
      'segment',
      {
        ruleType: 'segment',
        reason: 'SEGMENT_TARGETING',
        matchFn: matchesSegmentRule,
      },
    ],
  ]);

export const MATCHER_TIERS: readonly RuleType[] = [
  'user',
  'role',
  'segment',
  'custom',
  'percentage',
];

export function getMatcher(
  ruleType: RuleType,
): RuleMatcherStrategy | undefined {
  return RULE_MATCHER_REGISTRY.get(ruleType);
}
