import { FlagChangePublisher } from './flag-change.publisher';
import { FlagChangeEvent, FlagChangeEventType } from './flag-change.types';

describe('Flag Change Detection', () => {
  let publisher: FlagChangePublisher;

  beforeEach(() => {
    publisher = new FlagChangePublisher();
  });

  describe('Flag events', () => {
    it('should emit flag.created event', (done) => {
      const environmentId = 'env-1';
      const event: FlagChangeEvent = {
        type: 'flag.created',
        flagKey: 'new-flag',
        environmentId,
        timestamp: new Date().toISOString(),
      };

      publisher.subscribe(environmentId).subscribe((received) => {
        expect(received.type).toBe('flag.created');
        expect(received.flagKey).toBe('new-flag');
        done();
      });

      publisher.publish(environmentId, event);
    });

    it('should emit flag.updated event', (done) => {
      const environmentId = 'env-1';
      const event: FlagChangeEvent = {
        type: 'flag.updated',
        flagKey: 'existing-flag',
        environmentId,
        timestamp: new Date().toISOString(),
        changes: { name: { before: 'Old Name', after: 'New Name' } },
      };

      publisher.subscribe(environmentId).subscribe((received) => {
        expect(received.type).toBe('flag.updated');
        expect(received.flagKey).toBe('existing-flag');
        expect(received.changes).toBeDefined();
        done();
      });

      publisher.publish(environmentId, event);
    });

    it('should emit flag.toggled event', (done) => {
      const environmentId = 'env-1';
      const event: FlagChangeEvent = {
        type: 'flag.toggled',
        flagKey: 'toggle-flag',
        environmentId,
        timestamp: new Date().toISOString(),
        changes: {
          before: { isEnabled: false },
          after: { isEnabled: true },
        },
      };

      publisher.subscribe(environmentId).subscribe((received) => {
        expect(received.type).toBe('flag.toggled');
        expect(received.flagKey).toBe('toggle-flag');
        done();
      });

      publisher.publish(environmentId, event);
    });

    it('should emit flag.archived event', (done) => {
      const environmentId = 'env-1';
      const event: FlagChangeEvent = {
        type: 'flag.archived',
        flagKey: 'archive-flag',
        environmentId,
        timestamp: new Date().toISOString(),
      };

      publisher.subscribe(environmentId).subscribe((received) => {
        expect(received.type).toBe('flag.archived');
        expect(received.flagKey).toBe('archive-flag');
        done();
      });

      publisher.publish(environmentId, event);
    });
  });

  describe('Rule events', () => {
    it('should emit rule.created event', (done) => {
      const environmentId = 'env-1';
      const event: FlagChangeEvent = {
        type: 'rule.created',
        flagKey: 'target-flag',
        environmentId,
        timestamp: new Date().toISOString(),
        changes: { ruleId: 'rule-1' },
      };

      publisher.subscribe(environmentId).subscribe((received) => {
        expect(received.type).toBe('rule.created');
        expect(received.flagKey).toBe('target-flag');
        expect(received.changes).toEqual({ ruleId: 'rule-1' });
        done();
      });

      publisher.publish(environmentId, event);
    });

    it('should emit rule.updated event', (done) => {
      const environmentId = 'env-1';
      const event: FlagChangeEvent = {
        type: 'rule.updated',
        flagKey: 'target-flag',
        environmentId,
        timestamp: new Date().toISOString(),
        changes: { ruleId: 'rule-1' },
      };

      publisher.subscribe(environmentId).subscribe((received) => {
        expect(received.type).toBe('rule.updated');
        expect(received.flagKey).toBe('target-flag');
        done();
      });

      publisher.publish(environmentId, event);
    });

    it('should emit rule.deleted event', (done) => {
      const environmentId = 'env-1';
      const event: FlagChangeEvent = {
        type: 'rule.deleted',
        flagKey: 'target-flag',
        environmentId,
        timestamp: new Date().toISOString(),
        changes: { ruleId: 'rule-1' },
      };

      publisher.subscribe(environmentId).subscribe((received) => {
        expect(received.type).toBe('rule.deleted');
        expect(received.flagKey).toBe('target-flag');
        done();
      });

      publisher.publish(environmentId, event);
    });
  });

  describe('Event metadata', () => {
    it('should include correct timestamp', (done) => {
      const environmentId = 'env-1';
      const timestamp = new Date().toISOString();
      const event: FlagChangeEvent = {
        type: 'flag.updated',
        flagKey: 'test-flag',
        environmentId,
        timestamp,
      };

      publisher.subscribe(environmentId).subscribe((received) => {
        expect(received.timestamp).toBe(timestamp);
        done();
      });

      publisher.publish(environmentId, event);
    });

    it('should include correct environmentId', (done) => {
      const environmentId = 'env-123';
      const event: FlagChangeEvent = {
        type: 'flag.updated',
        flagKey: 'test-flag',
        environmentId,
        timestamp: new Date().toISOString(),
      };

      publisher.subscribe(environmentId).subscribe((received) => {
        expect(received.environmentId).toBe(environmentId);
        done();
      });

      publisher.publish(environmentId, event);
    });
  });
});
