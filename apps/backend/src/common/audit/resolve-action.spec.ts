import {
  resolveFlagAction,
  resolveFlagStateAction,
  resolveRuleAction,
  resolveSdkKeyAction,
  resolveProjectAction,
  resolveEnvironmentAction,
  resolveOrganizationAction,
} from './resolve-action';

describe('resolve-action', () => {
  describe('resolveFlagAction', () => {
    it('should return FLAG_CREATE when before is null', () => {
      const after = {
        id: '1',
        organizationId: 'org-1',
        projectId: 'proj-1',
        key: 'test-flag',
        version: 1,
      };

      expect(resolveFlagAction(null as any, after as any)).toBe('FLAG_CREATE');
    });

    it('should return FLAG_DELETE when after is null', () => {
      const before = {
        id: '1',
        organizationId: 'org-1',
        projectId: 'proj-1',
        key: 'test-flag',
        version: 1,
      };

      expect(resolveFlagAction(before as any, null as any)).toBe('FLAG_DELETE');
    });

    it('should return FLAG_UPDATE for other changes', () => {
      const before = {
        id: '1',
        organizationId: 'org-1',
        projectId: 'proj-1',
        key: 'test-flag',
        version: 1,
      };

      const after = { ...before, name: 'New Name', version: 2 };

      expect(resolveFlagAction(before as any, after as any)).toBe(
        'FLAG_UPDATE',
      );
    });
  });

  describe('resolveFlagStateAction', () => {
    it('should return FLAG_STATE_CREATE when before is null', () => {
      const after = {
        id: '1',
        featureFlagId: 'flag-1',
        environmentId: 'env-1',
        isEnabled: false,
        status: 'draft',
      };

      expect(resolveFlagStateAction(null as any, after as any)).toBe(
        'FLAG_STATE_CREATE',
      );
    });

    it('should return FLAG_STATE_DELETE when after is null', () => {
      const before = {
        id: '1',
        featureFlagId: 'flag-1',
        environmentId: 'env-1',
        isEnabled: false,
        status: 'draft',
      };

      expect(resolveFlagStateAction(before as any, null as any)).toBe(
        'FLAG_STATE_DELETE',
      );
    });

    it('should return FLAG_ARCHIVE when status changes to archived', () => {
      const before = {
        id: '1',
        featureFlagId: 'flag-1',
        environmentId: 'env-1',
        status: 'active',
        isEnabled: true,
      };

      const after = { ...before, status: 'archived' };

      expect(resolveFlagStateAction(before as any, after as any)).toBe(
        'FLAG_ARCHIVE',
      );
    });

    it('should return FLAG_ACTIVATE when status changes from draft to active', () => {
      const before = {
        id: '1',
        featureFlagId: 'flag-1',
        environmentId: 'env-1',
        status: 'draft',
        isEnabled: false,
      };

      const after = { ...before, status: 'active', isEnabled: true };

      expect(resolveFlagStateAction(before as any, after as any)).toBe(
        'FLAG_ACTIVATE',
      );
    });

    it('should return FLAG_TOGGLE when isEnabled changes', () => {
      const before = {
        id: '1',
        featureFlagId: 'flag-1',
        environmentId: 'env-1',
        status: 'active',
        isEnabled: false,
      };

      const after = { ...before, isEnabled: true };

      expect(resolveFlagStateAction(before as any, after as any)).toBe(
        'FLAG_TOGGLE',
      );
    });

    it('should return FLAG_STATE_UPDATE for other changes', () => {
      const before = {
        id: '1',
        featureFlagId: 'flag-1',
        environmentId: 'env-1',
        status: 'active',
        isEnabled: true,
      };

      const after = { ...before, someOtherField: 'new' };

      expect(resolveFlagStateAction(before as any, after as any)).toBe(
        'FLAG_STATE_UPDATE',
      );
    });
  });

  describe('resolveRuleAction', () => {
    it('should return RULE_CREATE when before is null', () => {
      const after = {
        id: '1',
        organizationId: 'org-1',
        featureFlagId: 'flag-1',
        ruleType: 'user',
        priority: 'a',
        isEnabled: true,
      };

      expect(resolveRuleAction(null as any, after as any)).toBe('RULE_CREATE');
    });

    it('should return RULE_TOGGLE when isEnabled changes', () => {
      const before = {
        id: '1',
        organizationId: 'org-1',
        featureFlagId: 'flag-1',
        ruleType: 'user',
        priority: 'a',
        isEnabled: false,
      };

      const after = { ...before, isEnabled: true };

      expect(resolveRuleAction(before as any, after as any)).toBe(
        'RULE_TOGGLE',
      );
    });

    it('should return RULE_REORDER when priority changes', () => {
      const before = {
        id: '1',
        organizationId: 'org-1',
        featureFlagId: 'flag-1',
        ruleType: 'user',
        priority: 'a',
        isEnabled: true,
      };

      const after = { ...before, priority: 'b' };

      expect(resolveRuleAction(before as any, after as any)).toBe(
        'RULE_REORDER',
      );
    });

    it('should return RULE_UPDATE for other changes', () => {
      const before = {
        id: '1',
        organizationId: 'org-1',
        featureFlagId: 'flag-1',
        ruleType: 'user',
        priority: 'a',
        isEnabled: true,
      };

      const after = { ...before, conditions: [{ type: 'new' }] };

      expect(resolveRuleAction(before as any, after as any)).toBe(
        'RULE_UPDATE',
      );
    });
  });

  describe('resolveSdkKeyAction', () => {
    it('should return SDK_KEY_CREATE when before is null', () => {
      const after = {
        id: '1',
        organizationId: 'org-1',
        environmentId: 'env-1',
        name: 'Test Key',
        keyHint: '12345678',
        type: 'client',
        isActive: true,
      };

      expect(resolveSdkKeyAction(null as any, after as any)).toBe(
        'SDK_KEY_CREATE',
      );
    });

    it('should return SDK_KEY_DELETE when after is null', () => {
      const before = {
        id: '1',
        organizationId: 'org-1',
        environmentId: 'env-1',
        name: 'Test Key',
        keyHint: '12345678',
        type: 'client',
        isActive: true,
      };

      expect(resolveSdkKeyAction(before as any, null as any)).toBe(
        'SDK_KEY_DELETE',
      );
    });

    it('should return SDK_KEY_REVOKE when isActive changes from true to false', () => {
      const before = {
        id: '1',
        organizationId: 'org-1',
        environmentId: 'env-1',
        name: 'Test Key',
        keyHint: '12345678',
        type: 'client',
        isActive: true,
      };

      const after = { ...before, isActive: false };

      expect(resolveSdkKeyAction(before as any, after as any)).toBe(
        'SDK_KEY_REVOKE',
      );
    });

    it('should return SDK_KEY_ROTATE when keyHash changes', () => {
      const before = {
        id: '1',
        organizationId: 'org-1',
        environmentId: 'env-1',
        name: 'Test Key',
        keyHint: '12345678',
        keyHash: 'hash1',
        type: 'client',
        isActive: true,
      };

      const after = { ...before, keyHash: 'hash2' }; // keyHint same, hash changed

      expect(resolveSdkKeyAction(before as any, after as any)).toBe(
        'SDK_KEY_ROTATE',
      );
    });

    it('should return SDK_KEY_UPDATE when name changes', () => {
      const before = {
        id: '1',
        organizationId: 'org-1',
        environmentId: 'env-1',
        name: 'Test Key',
        keyHint: '12345678',
        keyHash: 'hash1',
        type: 'client',
        isActive: true,
      };

      const after = { ...before, name: 'New Key' };

      expect(resolveSdkKeyAction(before as any, after as any)).toBe(
        'SDK_KEY_UPDATE',
      );
    });
  });

  describe('resolveProjectAction', () => {
    it('should return PROJECT_CREATE when before is null', () => {
      const after = {
        id: '1',
        organizationId: 'org-1',
        name: 'Test Project',
        slug: 'test-project',
      };

      expect(resolveProjectAction(null as any, after as any)).toBe(
        'PROJECT_CREATE',
      );
    });

    it('should return PROJECT_UPDATE when before exists', () => {
      const before = {
        id: '1',
        organizationId: 'org-1',
        name: 'Test Project',
        slug: 'test-project',
      };

      const after = { ...before, name: 'New Name' };

      expect(resolveProjectAction(before as any, after as any)).toBe(
        'PROJECT_UPDATE',
      );
    });
  });

  describe('resolveEnvironmentAction', () => {
    it('should return ENV_CREATE when before is null', () => {
      const after = {
        id: '1',
        projectId: 'proj-1',
        name: 'Production',
        slug: 'production',
      };

      expect(resolveEnvironmentAction(null as any, after as any)).toBe(
        'ENV_CREATE',
      );
    });

    it('should return ENV_UPDATE when before exists', () => {
      const before = {
        id: '1',
        projectId: 'proj-1',
        name: 'Production',
        slug: 'production',
      };

      const after = { ...before, name: 'Staging' };

      expect(resolveEnvironmentAction(before as any, after as any)).toBe(
        'ENV_UPDATE',
      );
    });
  });

  describe('resolveOrganizationAction', () => {
    it('should return ORG_CREATE when before is null', () => {
      const after = {
        id: '1',
        name: 'Test Org',
        slug: 'test-org',
      };

      expect(resolveOrganizationAction(null as any, after as any)).toBe(
        'ORG_CREATE',
      );
    });

    it('should return ORG_UPDATE when before exists', () => {
      const before = {
        id: '1',
        name: 'Test Org',
        slug: 'test-org',
      };

      const after = { ...before, name: 'New Name' };

      expect(resolveOrganizationAction(before as any, after as any)).toBe(
        'ORG_UPDATE',
      );
    });
  });
});
