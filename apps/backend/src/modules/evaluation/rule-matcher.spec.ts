import {
  matchesKillSwitch,
  matchesUserRule,
  matchesRoleRule,
  matchesPercentageRule,
  type RuleForMatching,
} from './rule-matcher';

describe('rule-matcher', () => {
  const baseRule: RuleForMatching = {
    id: 'rule-1',
    ruleType: 'user',
    priority: 'a0',
    isEnabled: true,
    conditions: {},
  };

  describe('matchesKillSwitch', () => {
    it('should return true when rule is kill_switch and enabled', () => {
      const rule: RuleForMatching = {
        ...baseRule,
        ruleType: 'kill_switch',
        isEnabled: true,
      };
      expect(matchesKillSwitch(rule)).toBe(true);
    });

    it('should return false when rule is kill_switch but disabled', () => {
      const rule: RuleForMatching = {
        ...baseRule,
        ruleType: 'kill_switch',
        isEnabled: false,
      };
      expect(matchesKillSwitch(rule)).toBe(false);
    });

    it('should return false when rule is not kill_switch', () => {
      const rule: RuleForMatching = {
        ...baseRule,
        ruleType: 'user',
        isEnabled: true,
      };
      expect(matchesKillSwitch(rule)).toBe(false);
    });
  });

  describe('matchesUserRule', () => {
    it('should return true when userId is in the list', () => {
      const rule: RuleForMatching = {
        ...baseRule,
        ruleType: 'user',
        conditions: { userIds: ['user-1', 'user-2', 'user-3'] },
      };
      expect(matchesUserRule(rule, 'flag', { userId: 'user-2' })).toBe(true);
    });

    it('should return false when userId is not in the list', () => {
      const rule: RuleForMatching = {
        ...baseRule,
        ruleType: 'user',
        conditions: { userIds: ['user-1', 'user-2'] },
      };
      expect(matchesUserRule(rule, 'flag', { userId: 'user-999' })).toBe(false);
    });

    it('should return false when context has no userId (anonymous)', () => {
      const rule: RuleForMatching = {
        ...baseRule,
        ruleType: 'user',
        conditions: { userIds: ['user-1'] },
      };
      expect(matchesUserRule(rule, 'flag', {})).toBe(false);
    });

    it('should return false when conditions.userIds is missing', () => {
      const rule: RuleForMatching = {
        ...baseRule,
        ruleType: 'user',
        conditions: {},
      };
      expect(matchesUserRule(rule, 'flag', { userId: 'user-1' })).toBe(false);
    });
  });

  describe('matchesRoleRule', () => {
    it('should return true when role is in the list', () => {
      const rule: RuleForMatching = {
        ...baseRule,
        ruleType: 'role',
        conditions: { roles: ['admin', 'editor'] },
      };
      expect(matchesRoleRule(rule, 'flag', { role: 'admin' })).toBe(true);
    });

    it('should return false when role is not in the list', () => {
      const rule: RuleForMatching = {
        ...baseRule,
        ruleType: 'role',
        conditions: { roles: ['admin'] },
      };
      expect(matchesRoleRule(rule, 'flag', { role: 'viewer' })).toBe(false);
    });

    it('should return false when context has no role', () => {
      const rule: RuleForMatching = {
        ...baseRule,
        ruleType: 'role',
        conditions: { roles: ['admin'] },
      };
      expect(matchesRoleRule(rule, 'flag', { userId: 'user-1' })).toBe(false);
    });
  });

  describe('matchesPercentageRule', () => {
    it('should return true when bucket is less than percentage', () => {
      const rule: RuleForMatching = {
        ...baseRule,
        ruleType: 'percentage',
        conditions: { percentage: 100 },
      };
      expect(matchesPercentageRule(rule, 'flag', { userId: 'user-1' })).toBe(
        true,
      );
    });

    it('should return false when percentage is 0', () => {
      const rule: RuleForMatching = {
        ...baseRule,
        ruleType: 'percentage',
        conditions: { percentage: 0 },
      };
      expect(matchesPercentageRule(rule, 'flag', { userId: 'user-1' })).toBe(
        false,
      );
    });

    it('should return false when context has no userId (anonymous)', () => {
      const rule: RuleForMatching = {
        ...baseRule,
        ruleType: 'percentage',
        conditions: { percentage: 100 },
      };
      expect(matchesPercentageRule(rule, 'flag', {})).toBe(false);
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
      expect(result1).toBe(result2);
    });
  });
});
