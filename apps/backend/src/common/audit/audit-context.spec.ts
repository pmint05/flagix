import { auditContextStorage, AuditContext } from './audit-context';

describe('auditContextStorage', () => {
  it('should store and retrieve audit context', (done) => {
    const ctx: AuditContext = {
      actorId: 'user-1',
      actorEmail: 'test@example.com',
      actorType: 'user',
      requestId: 'req-1',
      ip: '127.0.0.1',
      userAgent: 'test-agent',
      method: 'POST',
      path: '/api/v1/flags',
      source: 'api',
    };

    auditContextStorage.run(ctx, () => {
      const stored = auditContextStorage.getStore();
      expect(stored).toEqual(ctx);
      done();
    });
  });

  it('should return undefined outside of context', () => {
    const stored = auditContextStorage.getStore();
    expect(stored).toBeUndefined();
  });

  it('should isolate contexts between runs', (done) => {
    const ctx1: AuditContext = {
      actorId: 'user-1',
      actorType: 'user',
    };

    const ctx2: AuditContext = {
      actorId: 'user-2',
      actorType: 'user',
    };

    auditContextStorage.run(ctx1, () => {
      const stored1 = auditContextStorage.getStore();
      expect(stored1?.actorId).toBe('user-1');

      auditContextStorage.run(ctx2, () => {
        const stored2 = auditContextStorage.getStore();
        expect(stored2?.actorId).toBe('user-2');
      });

      const stored1Again = auditContextStorage.getStore();
      expect(stored1Again?.actorId).toBe('user-1');

      done();
    });
  });
});
