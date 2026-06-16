import { AsyncLocalStorage } from 'async_hooks';

export interface AuditContext {
  actorId?: string;
  actorEmail?: string;
  actorType: 'user' | 'system';
  requestId?: string;
  ip?: string;
  userAgent?: string;
  method?: string;
  path?: string;
  source?: 'web' | 'api' | 'sdk' | 'system';
}

export const auditContextStorage = new AsyncLocalStorage<AuditContext>();

export function getActorId(): string | undefined {
  return auditContextStorage.getStore()?.actorId;
}
