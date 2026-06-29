import {
  matchesKillSwitch,
  matchesUserRule,
  matchesRoleRule,
  matchesPercentageRule,
  matchesCustomRule,
  type RuleForMatching,
} from './rule-matcher';

describe('rule-matcher', () => {
  const baseRule: RuleForMatching = {
    id: 'rule-1',
    ruleType: 'user',
    priority: 'a0',
    isEnabled: true,
    variationId: 'var-1',
    conditions: {},
  };

  describe('matchesKillSwitch', () => {
    it('should return true when rule is kill_switch and enabled', () => {
      const rule: RuleForMatching = {
        ...baseRule,
        ruleType: 'kill_switch',
        isEnabled: true,
      };
      expect(matchesKillSwitch(rule).isMatched).toBe(true);
    });

    it('should return false when rule is kill_switch but disabled', () => {
      const rule: RuleForMatching = {
        ...baseRule,
        ruleType: 'kill_switch',
        isEnabled: false,
      };
      expect(matchesKillSwitch(rule).isMatched).toBe(false);
    });

    it('should return false when rule is not kill_switch', () => {
      const rule: RuleForMatching = {
        ...baseRule,
        ruleType: 'user',
        isEnabled: true,
      };
      expect(matchesKillSwitch(rule).isMatched).toBe(false);
    });
  });

  describe('matchesUserRule', () => {
    it('should return true when userId is in the list', () => {
      const rule: RuleForMatching = {
        ...baseRule,
        ruleType: 'user',
        conditions: { userIds: ['user-1', 'user-2', 'user-3'] },
      };
      expect(matchesUserRule(rule, 'flag', { userId: 'user-2' }).isMatched).toBe(true);
    });

    it('should return false when userId is not in the list', () => {
      const rule: RuleForMatching = {
        ...baseRule,
        ruleType: 'user',
        conditions: { userIds: ['user-1', 'user-2'] },
      };
      expect(matchesUserRule(rule, 'flag', { userId: 'user-999' }).isMatched).toBe(false);
    });

    it('should return false when context has no userId (anonymous)', () => {
      const rule: RuleForMatching = {
        ...baseRule,
        ruleType: 'user',
        conditions: { userIds: ['user-1'] },
      };
      expect(matchesUserRule(rule, 'flag', {}).isMatched).toBe(false);
    });

    it('should return false when conditions.userIds is missing', () => {
      const rule: RuleForMatching = {
        ...baseRule,
        ruleType: 'user',
        conditions: {},
      };
      expect(matchesUserRule(rule, 'flag', { userId: 'user-1' }).isMatched).toBe(false);
    });
  });

  describe('matchesRoleRule', () => {
    it('should return true when role is in the list', () => {
      const rule: RuleForMatching = {
        ...baseRule,
        ruleType: 'role',
        conditions: { roles: ['admin', 'editor'] },
      };
      expect(matchesRoleRule(rule, 'flag', { role: 'admin' }).isMatched).toBe(true);
    });

    it('should return false when role is not in the list', () => {
      const rule: RuleForMatching = {
        ...baseRule,
        ruleType: 'role',
        conditions: { roles: ['admin'] },
      };
      expect(matchesRoleRule(rule, 'flag', { role: 'viewer' }).isMatched).toBe(false);
    });

    it('should return false when context has no role', () => {
      const rule: RuleForMatching = {
        ...baseRule,
        ruleType: 'role',
        conditions: { roles: ['admin'] },
      };
      expect(matchesRoleRule(rule, 'flag', { userId: 'user-1' }).isMatched).toBe(false);
    });
  });

  describe('matchesPercentageRule', () => {
    it('should return true when bucket is less than percentage (legacy)', () => {
      const rule: RuleForMatching = {
        ...baseRule,
        ruleType: 'percentage',
        conditions: { percentage: 100 },
      };
      expect(matchesPercentageRule(rule, 'flag', { userId: 'user-1' }).isMatched).toBe(
        true,
      );
    });

    it('should support multi-variation rollouts', () => {
      const rule: RuleForMatching = {
        ...baseRule,
        ruleType: 'percentage',
        conditions: {
          rollouts: [
            { variationId: 'var-a', percentage: 30 },
            { variationId: 'var-b', percentage: 70 },
          ],
        },
      };
      const res = matchesPercentageRule(rule, 'flag', { userId: 'user-1' });
      expect(res.isMatched).toBe(true);
      expect(['var-a', 'var-b']).toContain(res.variationId);
    });

    it('should fail-through when bucket falls outside rollout sum', () => {
      const rule: RuleForMatching = {
        ...baseRule,
        ruleType: 'percentage',
        conditions: {
          rollouts: [
            { variationId: 'var-a', percentage: 0 },
          ],
        },
      };
      const res = matchesPercentageRule(rule, 'flag', { userId: 'user-1' });
      expect(res.isMatched).toBe(false);
    });

    it('should return false when legacy percentage is 0', () => {
      const rule: RuleForMatching = {
        ...baseRule,
        ruleType: 'percentage',
        conditions: { percentage: 0 },
      };
      expect(matchesPercentageRule(rule, 'flag', { userId: 'user-1' }).isMatched).toBe(
        false,
      );
    });

    it('should return false when context has no userId (anonymous)', () => {
      const rule: RuleForMatching = {
        ...baseRule,
        ruleType: 'percentage',
        conditions: { percentage: 100 },
      };
      expect(matchesPercentageRule(rule, 'flag', {}).isMatched).toBe(false);
    });

    it('should be deterministic for same input', () => {
      const rule: RuleForMatching = {
        ...baseRule,
        ruleType: 'percentage',
        conditions: { percentage: 50 },
      };
      const context = { userId: 'user-deterministic' };
      const result1 = matchesPercentageRule(rule, 'flag-key', context);
      const result2 = matchesPercentageRule(rule, 'flag-key', context);
      expect(result1).toEqual(result2);
    });
  });

  describe('matchesCustomRule', () => {
    it('should return true when custom conditions match (equals)', () => {
      const rule: RuleForMatching = {
        ...baseRule,
        ruleType: 'custom',
        conditions: {
          conditions: [
            { contextKey: 'country', type: 'string', operator: 'equals', value: 'VN' },
          ],
        },
      };
      expect(
        matchesCustomRule(rule, 'flag', {
          userId: 'user-1',
          attributes: { country: 'VN' },
        }).isMatched,
      ).toBe(true);
    });

    it('should return false when custom conditions do not match (equals)', () => {
      const rule: RuleForMatching = {
        ...baseRule,
        ruleType: 'custom',
        conditions: {
          conditions: [
            { contextKey: 'country', type: 'string', operator: 'equals', value: 'US' },
          ],
        },
      };
      expect(
        matchesCustomRule(rule, 'flag', {
          userId: 'user-1',
          attributes: { country: 'VN' },
        }).isMatched,
      ).toBe(false);
    });

    it('should match multiple clauses (AND logic)', () => {
      const rule: RuleForMatching = {
        ...baseRule,
        ruleType: 'custom',
        conditions: {
          conditions: [
            { contextKey: 'country', type: 'string', operator: 'equals', value: 'VN' },
            { contextKey: 'age', type: 'number', operator: 'greater_than', value: 18 },
          ],
        },
      };
      
      expect(
        matchesCustomRule(rule, 'flag', {
          userId: 'user-1',
          attributes: { country: 'VN', age: 20 },
        }).isMatched,
      ).toBe(true);

      expect(
        matchesCustomRule(rule, 'flag', {
          userId: 'user-1',
          attributes: { country: 'VN', age: 15 },
        }).isMatched,
      ).toBe(false);
    });
  });
});
