import { ExecutionContext, CallHandler } from '@nestjs/common';
import { AuditContextEnhancerInterceptor } from './audit-context.enhancer';
import { auditContextStorage } from './audit-context';

describe('AuditContextEnhancerInterceptor', () => {
  const interceptor = new AuditContextEnhancerInterceptor();

  function createContext(user?: { id: string; email: string } | null) {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as ExecutionContext;
  }

  function createHandler(): CallHandler {
    return { handle: jest.fn(() => ({ subscribe: jest.fn() }) as any) };
  }

  it('should update audit context with authenticated user', () => {
    auditContextStorage.run(
      {
        actorType: 'system',
        source: 'api',
      },
      () => {
        const ctx = createContext({ id: 'user-1', email: 'a@example.com' });
        const handler = createHandler();

        interceptor.intercept(ctx, handler);

        const store = auditContextStorage.getStore();
        expect(store?.actorId).toBe('user-1');
        expect(store?.actorEmail).toBe('a@example.com');
        expect(store?.actorType).toBe('user');
      },
    );
  });

  it('should leave system actorType when user is not present', () => {
    auditContextStorage.run(
      {
        actorType: 'system',
        source: 'api',
      },
      () => {
        const ctx = createContext(null);
        const handler = createHandler();

        interceptor.intercept(ctx, handler);

        const store = auditContextStorage.getStore();
        expect(store?.actorId).toBeUndefined();
        expect(store?.actorType).toBe('system');
      },
    );
  });

  it('should not throw when no audit context store exists', () => {
    // Run outside of any audit context storage
    const ctx = createContext({ id: 'user-1', email: 'a@example.com' });
    const handler = createHandler();

    expect(() => interceptor.intercept(ctx, handler)).not.toThrow();
  });
});
