import { FlagChangePublisher } from './flag-change.publisher';
import { FlagChangeEvent } from './flag-change.types';

describe('FlagChangePublisher', () => {
  let publisher: FlagChangePublisher;

  beforeEach(() => {
    publisher = new FlagChangePublisher();
  });

  describe('publish and subscribe', () => {
    it('should deliver events to subscribers', (done) => {
      const environmentId = 'env-1';
      const event: FlagChangeEvent = {
        type: 'flag.updated',
        flagKey: 'test-flag',
        timestamp: new Date().toISOString(),
      };

      publisher.subscribe(environmentId).subscribe((received) => {
        expect(received).toEqual(event);
        done();
      });

      publisher.publish(environmentId, event);
    });

    it('should deliver events to multiple subscribers', (done) => {
      const environmentId = 'env-1';
      const event: FlagChangeEvent = {
        type: 'flag.toggled',
        flagKey: 'test-flag',
        timestamp: new Date().toISOString(),
      };

      let receivedCount = 0;
      const expectedCount = 2;

      const checkDone = () => {
        receivedCount++;
        if (receivedCount === expectedCount) {
          done();
        }
      };

      publisher.subscribe(environmentId).subscribe(() => checkDone());
      publisher.subscribe(environmentId).subscribe(() => checkDone());

      publisher.publish(environmentId, event);
    });

    it('should not deliver events after unsubscribe', (done) => {
      const environmentId = 'env-1';
      const event: FlagChangeEvent = {
        type: 'flag.created',
        flagKey: 'test-flag',
        timestamp: new Date().toISOString(),
      };

      const subscription = publisher.subscribe(environmentId).subscribe(() => {
        fail('Should not receive events after unsubscribe');
      });

      subscription.unsubscribe();

      publisher.publish(environmentId, event);

      setTimeout(() => done(), 50);
    });

    it('should scope events by environmentId', (done) => {
      const event1: FlagChangeEvent = {
        type: 'flag.updated',
        flagKey: 'test-flag',
        timestamp: new Date().toISOString(),
      };

      const event2: FlagChangeEvent = {
        type: 'flag.updated',
        flagKey: 'test-flag',
        timestamp: new Date().toISOString(),
      };

      publisher.subscribe('env-1').subscribe((received) => {
        expect(received.flagKey).toBe('test-flag');
        done();
      });

      publisher.publish('env-1', event1);
      publisher.publish('env-2', event2);
    });
  });

  describe('filtering', () => {
    it('should filter by event types', (done) => {
      const environmentId = 'env-1';
      const event: FlagChangeEvent = {
        type: 'flag.toggled',
        flagKey: 'test-flag',
        timestamp: new Date().toISOString(),
      };

      publisher
        .subscribe(environmentId, { eventTypes: ['flag.toggled'] })
        .subscribe((received) => {
          expect(received.type).toBe('flag.toggled');
          done();
        });

      publisher.publish(environmentId, event);
    });

    it('should filter by flagKey', (done) => {
      const environmentId = 'env-1';
      const event: FlagChangeEvent = {
        type: 'flag.updated',
        flagKey: 'specific-flag',
        timestamp: new Date().toISOString(),
      };

      publisher
        .subscribe(environmentId, { flagKey: 'specific-flag' })
        .subscribe((received) => {
          expect(received.flagKey).toBe('specific-flag');
          done();
        });

      publisher.publish(environmentId, event);
    });

    it('should not deliver events when filter does not match', (done) => {
      const environmentId = 'env-1';
      const event: FlagChangeEvent = {
        type: 'flag.updated',
        flagKey: 'other-flag',
        timestamp: new Date().toISOString(),
      };

      publisher
        .subscribe(environmentId, { flagKey: 'specific-flag' })
        .subscribe(() => {
          fail('Should not receive events when filter does not match');
        });

      publisher.publish(environmentId, event);

      setTimeout(() => done(), 50);
    });
  });
});
