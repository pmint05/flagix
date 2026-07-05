import { evaluate } from './evaluation.engine';
import type { LoadedFlag } from './safe-default.util';

describe('evaluation.engine', () => {
  const createFlag = (overrides: Partial<LoadedFlag> = {}): LoadedFlag => ({
    id: 'flag-1',
    key: 'test-flag',
    name: 'Test Flag',
    flagType: 'boolean',
    status: 'active',
    isEnabled: true,
    version: 1,
    defaultVariationId: 'var-false',
    variations: [
      { id: 'var-true', key: 'true', value: true, isDefault: false },
      { id: 'var-false', key: 'false', value: false, isDefault: true },
    ],
    rules: [],
    visibility: 'all',
    ...overrides,
  });

  describe('lifecycle checks', () => {
    it('should return FLAG_ARCHIVED for archived flags', () => {
      const flag = createFlag({ status: 'archived' });
      const result = evaluate(flag, { userId: 'user-1' });
      expect(result.evaluationReason).toBe('FLAG_ARCHIVED');
      expect(result.enabled).toBe(false);
    });

    it('should return FLAG_DRAFT for draft flags', () => {
      const flag = createFlag({ status: 'draft' });
      const result = evaluate(flag, { userId: 'user-1' });
      expect(result.evaluationReason).toBe('FLAG_DRAFT');
      expect(result.enabled).toBe(false);
    });

    it('should return FLAG_DISABLED when isEnabled is false', () => {
      const flag = createFlag({ isEnabled: false });
      const result = evaluate(flag, { userId: 'user-1' });
      expect(result.evaluationReason).toBe('FLAG_DISABLED');
      expect(result.enabled).toBe(false);
    });
  });

  describe('kill switch', () => {
    it('should return KILL_SWITCH when kill switch rule is enabled', () => {
      const flag = createFlag({
        rules: [
          {
            id: 'rule-kill',
            ruleType: 'kill_switch',
            priority: 'a0',
            variationId: 'var-false',
            conditions: {},
            isEnabled: true,
          },
        ],
      });
      const result = evaluate(flag, { userId: 'user-1' });
      expect(result.evaluationReason).toBe('KILL_SWITCH');
      expect(result.enabled).toBe(false);
      expect(result.resolvedValue).toBe(false);
    });

    it('should ignore disabled kill switch', () => {
      const flag = createFlag({
        rules: [
          {
            id: 'rule-kill',
            ruleType: 'kill_switch',
            priority: 'a0',
            variationId: 'var-false',
            conditions: {},
            isEnabled: false,
          },
        ],
      });
      const result = evaluate(flag, { userId: 'user-1' });
      expect(result.evaluationReason).toBe('DEFAULT');
    });

    it('should short-circuit all other rules', () => {
      const flag = createFlag({
        rules: [
          {
            id: 'rule-kill',
            ruleType: 'kill_switch',
            priority: 'a0',
            variationId: 'var-false',
            conditions: {},
            isEnabled: true,
          },
          {
            id: 'rule-user',
            ruleType: 'user',
            priority: 'b0',
            variationId: 'var-true',
            conditions: { userIds: ['user-1'] },
            isEnabled: true,
          },
        ],
      });
      const result = evaluate(flag, { userId: 'user-1' });
      expect(result.evaluationReason).toBe('KILL_SWITCH');
      expect(result.enabled).toBe(false);
    });
  });

  describe('user targeting', () => {
    it('should return USER_TARGETING when userId matches', () => {
      const flag = createFlag({
        rules: [
          {
            id: 'rule-user',
            ruleType: 'user',
            priority: 'b0',
            variationId: 'var-true',
            conditions: { userIds: ['user-1', 'user-2'] },
            isEnabled: true,
          },
        ],
      });
      const result = evaluate(flag, { userId: 'user-1' });
      expect(result.evaluationReason).toBe('USER_TARGETING');
      expect(result.enabled).toBe(true);
      expect(result.resolvedValue).toBe(true);
    });

    it('should skip user rule when userId does not match', () => {
      const flag = createFlag({
        rules: [
          {
            id: 'rule-user',
            ruleType: 'user',
            priority: 'b0',
            variationId: 'var-true',
            conditions: { userIds: ['user-1'] },
            isEnabled: true,
          },
        ],
      });
      const result = evaluate(flag, { userId: 'user-999' });
      expect(result.evaluationReason).toBe('DEFAULT');
    });

    it('should skip user rule for anonymous users', () => {
      const flag = createFlag({
        rules: [
          {
            id: 'rule-user',
            ruleType: 'user',
            priority: 'b0',
            variationId: 'var-true',
            conditions: { userIds: ['user-1'] },
            isEnabled: true,
          },
        ],
      });
      const result = evaluate(flag, {});
      expect(result.evaluationReason).toBe('DEFAULT');
    });
  });

  describe('role targeting', () => {
    it('should return ROLE_TARGETING when role matches', () => {
      const flag = createFlag({
        rules: [
          {
            id: 'rule-role',
            ruleType: 'role',
            priority: 'c0',
            variationId: 'var-true',
            conditions: { roles: ['admin', 'editor'] },
            isEnabled: true,
          },
        ],
      });
      const result = evaluate(flag, { role: 'admin' });
      expect(result.evaluationReason).toBe('ROLE_TARGETING');
      expect(result.enabled).toBe(true);
    });

    it('should skip role rule when role does not match', () => {
      const flag = createFlag({
        rules: [
          {
            id: 'rule-role',
            ruleType: 'role',
            priority: 'c0',
            variationId: 'var-true',
            conditions: { roles: ['admin'] },
            isEnabled: true,
          },
        ],
      });
      const result = evaluate(flag, { role: 'viewer' });
      expect(result.evaluationReason).toBe('DEFAULT');
    });

    it('should skip role rule when context has no role', () => {
      const flag = createFlag({
        rules: [
          {
            id: 'rule-role',
            ruleType: 'role',
            priority: 'c0',
            variationId: 'var-true',
            conditions: { roles: ['admin'] },
            isEnabled: true,
          },
        ],
      });
      const result = evaluate(flag, { userId: 'user-1' });
      expect(result.evaluationReason).toBe('DEFAULT');
    });
  });

  describe('percentage rollout', () => {
    it('should return PERCENTAGE_ROLLOUT when bucket < percentage', () => {
      const flag = createFlag({
        rules: [
          {
            id: 'rule-pct',
            ruleType: 'percentage',
            priority: 'd0',
            variationId: 'var-true',
            conditions: { percentage: 100 },
            isEnabled: true,
          },
        ],
      });
      const result = evaluate(flag, { userId: 'user-1' });
      expect(result.evaluationReason).toBe('PERCENTAGE_ROLLOUT');
      expect(result.enabled).toBe(true);
    });

    it('should skip percentage rule when percentage is 0', () => {
      const flag = createFlag({
        rules: [
          {
            id: 'rule-pct',
            ruleType: 'percentage',
            priority: 'd0',
            variationId: 'var-true',
            conditions: { percentage: 0 },
            isEnabled: true,
          },
        ],
      });
      const result = evaluate(flag, { userId: 'user-1' });
      expect(result.evaluationReason).toBe('DEFAULT');
    });

    it('should skip percentage rule for anonymous users', () => {
      const flag = createFlag({
        rules: [
          {
            id: 'rule-pct',
            ruleType: 'percentage',
            priority: 'd0',
            variationId: 'var-true',
            conditions: { percentage: 100 },
            isEnabled: true,
          },
        ],
      });
      const result = evaluate(flag, {});
      expect(result.evaluationReason).toBe('DEFAULT');
    });
  });

  describe('default variation', () => {
    it('should return DEFAULT when no rule matches', () => {
      const flag = createFlag({ rules: [] });
      const result = evaluate(flag, { userId: 'user-1' });
      expect(result.evaluationReason).toBe('DEFAULT');
      expect(result.enabled).toBe(true);
      expect(result.resolvedValue).toBe(false);
      expect(result.variationKey).toBe('false');
    });
  });

  describe('priority ordering', () => {
    it('should evaluate rules sequentially in the order they are defined', () => {
      const flag = createFlag({
        rules: [
          {
            id: 'rule-user',
            ruleType: 'user',
            priority: 'b0',
            variationId: 'var-true',
            conditions: { userIds: ['user-1'] },
            isEnabled: true,
          },
          {
            id: 'rule-pct',
            ruleType: 'percentage',
            priority: 'd0',
            variationId: 'var-true',
            conditions: { percentage: 100 },
            isEnabled: true,
          },
        ],
      });
      const result = evaluate(flag, { userId: 'user-1' });
      expect(result.evaluationReason).toBe('USER_TARGETING');
    });

    it('should only return one rule result even when multiple match', () => {
      const flag = createFlag({
        rules: [
          {
            id: 'rule-user',
            ruleType: 'user',
            priority: 'b0',
            variationId: 'var-true',
            conditions: { userIds: ['user-1'] },
            isEnabled: true,
          },
          {
            id: 'rule-role',
            ruleType: 'role',
            priority: 'c0',
            variationId: 'var-true',
            conditions: { roles: ['admin'] },
            isEnabled: true,
          },
        ],
      });
      const result = evaluate(flag, { userId: 'user-1', role: 'admin' });
      expect(result.evaluationReason).toBe('USER_TARGETING');
    });
  });

  describe('multivariate flags', () => {
    it('should return the correct variation for multivariate flags', () => {
      const flag = createFlag({
        flagType: 'multivariate',
        variations: [
          { id: 'var-a', key: 'control', value: 'blue', isDefault: true },
          { id: 'var-b', key: 'variant-a', value: 'red', isDefault: false },
        ],
        rules: [
          {
            id: 'rule-user',
            ruleType: 'user',
            priority: 'b0',
            variationId: 'var-b',
            conditions: { userIds: ['user-1'] },
            isEnabled: true,
          },
        ],
      });
      const result = evaluate(flag, { userId: 'user-1' });
      expect(result.variationKey).toBe('variant-a');
      expect(result.resolvedValue).toBe('red');
    });
  });

  describe('environment-specific fallback values', () => {
    it('should return environment-specific offVariationId when flag is disabled', () => {
      const flag = createFlag({
        isEnabled: false,
        offVariationId: 'var-true',
      });
      const result = evaluate(flag, { userId: 'user-1' });
      expect(result.variationKey).toBe('true');
      expect(result.resolvedValue).toBe(true);
      expect(result.evaluationReason).toBe('FLAG_DISABLED');
    });

    it('should return safe default when offVariationId is invalid and defaultVariationId is also invalid', () => {
      const flag = createFlag({
        isEnabled: false,
        offVariationId: 'invalid-id',
        defaultVariationId: 'invalid-id',
      });
      const result = evaluate(flag, { userId: 'user-1' });
      expect(result.enabled).toBe(false);
      expect(result.evaluationReason).toBe('FLAG_DISABLED');
    });

    it('should return environment-specific defaultVariationId when no rules match', () => {
      const flag = createFlag({
        defaultVariationId: 'var-true',
      });
      const result = evaluate(flag, { userId: 'user-1' });
      expect(result.variationKey).toBe('true');
      expect(result.resolvedValue).toBe(true);
      expect(result.evaluationReason).toBe('DEFAULT');
    });

    it('should return safe default when defaultVariationId is invalid', () => {
      const flag = createFlag({
        defaultVariationId: 'invalid-id',
      });
      const result = evaluate(flag, { userId: 'user-1' });
      expect(result.enabled).toBe(false);
      expect(result.evaluationReason).toBe('EVALUATION_ERROR');
    });
  });
});
