import {
  sanitizeFlag,
  sanitizeSdkKey,
  sanitizeRule,
  sanitizeProject,
  sanitizeEnvironment,
  sanitizeOrganization,
} from './sanitize';

describe('sanitize', () => {
  describe('sanitizeFlag', () => {
    it('should remove organizationId', () => {
      const flag = {
        id: '1',
        organizationId: 'org-1',
        environmentId: 'env-1',
        key: 'test-flag',
        name: 'Test Flag',
      };

      const sanitized = sanitizeFlag(flag);

      expect(sanitized).not.toHaveProperty('organizationId');
      expect(sanitized).toHaveProperty('id', '1');
      expect(sanitized).toHaveProperty('key', 'test-flag');
    });
  });

  describe('sanitizeSdkKey', () => {
    it('should remove keyHash and organizationId', () => {
      const sdkKey = {
        id: '1',
        organizationId: 'org-1',
        environmentId: 'env-1',
        name: 'Test Key',
        keyHash: 'hashed-key-value',
        keyHint: '12345678',
        type: 'client',
        isActive: true,
      };

      const sanitized = sanitizeSdkKey(sdkKey);

      expect(sanitized).not.toHaveProperty('keyHash');
      expect(sanitized).not.toHaveProperty('organizationId');
      expect(sanitized).toHaveProperty('id', '1');
      expect(sanitized).toHaveProperty('keyHint', '12345678');
    });
  });

  describe('sanitizeRule', () => {
    it('should remove organizationId', () => {
      const rule = {
        id: '1',
        organizationId: 'org-1',
        featureFlagId: 'flag-1',
        ruleType: 'user',
        priority: 'a',
        isEnabled: true,
      };

      const sanitized = sanitizeRule(rule);

      expect(sanitized).not.toHaveProperty('organizationId');
      expect(sanitized).toHaveProperty('id', '1');
      expect(sanitized).toHaveProperty('ruleType', 'user');
    });
  });

  describe('sanitizeProject', () => {
    it('should remove organizationId', () => {
      const project = {
        id: '1',
        organizationId: 'org-1',
        name: 'Test Project',
        slug: 'test-project',
      };

      const sanitized = sanitizeProject(project);

      expect(sanitized).not.toHaveProperty('organizationId');
      expect(sanitized).toHaveProperty('id', '1');
      expect(sanitized).toHaveProperty('name', 'Test Project');
    });
  });

  describe('sanitizeEnvironment', () => {
    it('should remove organizationId', () => {
      const env = {
        id: '1',
        organizationId: 'org-1',
        projectId: 'proj-1',
        name: 'Production',
        slug: 'production',
      };

      const sanitized = sanitizeEnvironment(env);

      expect(sanitized).not.toHaveProperty('organizationId');
      expect(sanitized).toHaveProperty('id', '1');
      expect(sanitized).toHaveProperty('name', 'Production');
    });
  });

  describe('sanitizeOrganization', () => {
    it('should keep all fields', () => {
      const org = {
        id: '1',
        name: 'Test Org',
        slug: 'test-org',
      };

      const sanitized = sanitizeOrganization(org);

      expect(sanitized).toHaveProperty('id', '1');
      expect(sanitized).toHaveProperty('name', 'Test Org');
      expect(sanitized).toHaveProperty('slug', 'test-org');
    });
  });
});
