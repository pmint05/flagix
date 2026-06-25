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

      expect(resolveFlagAction(null, after)).toBe('FLAG_CREATE');
    });

    it('should return FLAG_DELETE when after is null', () => {
      const before = {
        id: '1',
        organizationId: 'org-1',
        projectId: 'proj-1',
        key: 'test-flag',
        version: 1,
      };

      expect(resolveFlagAction(before, null)).toBe('FLAG_DELETE');
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

      expect(resolveFlagAction(before, after)).toBe('FLAG_UPDATE');
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

      expect(resolveFlagStateAction(null, after)).toBe('FLAG_STATE_CREATE');
    });

    it('should return FLAG_STATE_DELETE when after is null', () => {
      const before = {
        id: '1',
        featureFlagId: 'flag-1',
        environmentId: 'env-1',
        isEnabled: false,
        status: 'draft',
      };

      expect(resolveFlagStateAction(before, null)).toBe('FLAG_STATE_DELETE');
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

      expect(resolveFlagStateAction(before, after)).toBe('FLAG_ARCHIVE');
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

      expect(resolveFlagStateAction(before, after)).toBe('FLAG_ACTIVATE');
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

      expect(resolveFlagStateAction(before, after)).toBe('FLAG_TOGGLE');
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

      expect(resolveFlagStateAction(before, after)).toBe('FLAG_STATE_UPDATE');
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

      expect(resolveRuleAction(null, after)).toBe('RULE_CREATE');
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

      expect(resolveRuleAction(before, after)).toBe('RULE_TOGGLE');
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

      expect(resolveRuleAction(before, after)).toBe('RULE_REORDER');
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

      expect(resolveRuleAction(before, after)).toBe('RULE_UPDATE');
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

      expect(resolveSdkKeyAction(null, after)).toBe('SDK_KEY_CREATE');
    });

    it('should return SDK_KEY_REVOKE when after is null', () => {
      const before = {
        id: '1',
        organizationId: 'org-1',
        environmentId: 'env-1',
        name: 'Test Key',
        keyHint: '12345678',
        type: 'client',
        isActive: true,
      };

      expect(resolveSdkKeyAction(before, null)).toBe('SDK_KEY_REVOKE');
    });

    it('should return SDK_KEY_ROTATE when both before and after exist', () => {
      const before = {
        id: '1',
        organizationId: 'org-1',
        environmentId: 'env-1',
        name: 'Test Key',
        keyHint: '12345678',
        type: 'client',
        isActive: true,
      };

      const after = { ...before, name: 'New Key' };

      expect(resolveSdkKeyAction(before, after)).toBe('SDK_KEY_ROTATE');
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

      expect(resolveProjectAction(null, after)).toBe('PROJECT_CREATE');
    });

    it('should return PROJECT_UPDATE when before exists', () => {
      const before = {
        id: '1',
        organizationId: 'org-1',
        name: 'Test Project',
        slug: 'test-project',
      };

      const after = { ...before, name: 'New Name' };

      expect(resolveProjectAction(before, after)).toBe('PROJECT_UPDATE');
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

      expect(resolveEnvironmentAction(null, after)).toBe('ENV_CREATE');
    });

    it('should return ENV_UPDATE when before exists', () => {
      const before = {
        id: '1',
        projectId: 'proj-1',
        name: 'Production',
        slug: 'production',
      };

      const after = { ...before, name: 'Staging' };

      expect(resolveEnvironmentAction(before, after)).toBe('ENV_UPDATE');
    });
  });

  describe('resolveOrganizationAction', () => {
    it('should return ORG_CREATE when before is null', () => {
      const after = {
        id: '1',
        name: 'Test Org',
        slug: 'test-org',
      };

      expect(resolveOrganizationAction(null, after)).toBe('ORG_CREATE');
    });

    it('should return ORG_UPDATE when before exists', () => {
      const before = {
        id: '1',
        name: 'Test Org',
        slug: 'test-org',
      };

      const after = { ...before, name: 'New Name' };

      expect(resolveOrganizationAction(before, after)).toBe('ORG_UPDATE');
    });
  });
});
