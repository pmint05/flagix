import { bucket } from './hash.util';

describe('hash.util', () => {
  describe('bucket', () => {
    it('should be deterministic - same input always produces same output', () => {
      const flagKey = 'dark-mode';
      const userId = 'user-123';

      const results = new Set<number>();
      for (let i = 0; i < 1000; i++) {
        results.add(bucket(flagKey, userId));
      }

      expect(results.size).toBe(1);
    });

    it('should return a value between 0 and 99', () => {
      for (let i = 0; i < 100; i++) {
        const result = bucket(`flag-${i}`, `user-${i}`);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThan(100);
      }
    });

    it('should distribute uniformly across 10000 random users', () => {
      const flagKey = 'test-flag';
      const targetPercentage = 30;
      const totalUsers = 10000;
      let matched = 0;

      for (let i = 0; i < totalUsers; i++) {
        const userId = `user-${Math.random().toString(36).substring(2, 15)}`;
        if (bucket(flagKey, userId) < targetPercentage) {
          matched++;
        }
      }

      const actualPercentage = (matched / totalUsers) * 100;
      expect(actualPercentage).toBeGreaterThan(targetPercentage - 2);
      expect(actualPercentage).toBeLessThan(targetPercentage + 2);
    });

    it('should produce different buckets for different flag keys', () => {
      const userId = 'user-123';
      const bucket1 = bucket('flag-a', userId);
      const bucket2 = bucket('flag-b', userId);

      expect(bucket1).not.toBe(bucket2);
    });

    it('should produce different buckets for different user IDs', () => {
      const flagKey = 'test-flag';
      const bucket1 = bucket(flagKey, 'user-1');
      const bucket2 = bucket(flagKey, 'user-2');

      expect(bucket1).not.toBe(bucket2);
    });
  });
});
