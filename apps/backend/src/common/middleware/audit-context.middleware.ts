import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { auditContextStorage, AuditContext } from '../audit/audit-context';

interface AuthenticatedRequest extends Request {
  user?: {
    id?: string;
    email?: string;
  };
  requestId?: string;
}

@Injectable()
export class AuditContextMiddleware implements NestMiddleware {
  use(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
    // Note: Better Auth sets req.user inside its AuthGuard, which runs after
    // middleware. The actor fields are therefore updated later by
    // AuditContextEnhancerInterceptor once authentication has completed.
    const ctx: AuditContext = {
      actorId: req.user?.id,
      actorEmail: req.user?.email,
      actorType: req.user?.id ? 'user' : 'system',
      requestId: req.requestId,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      method: req.method,
      path: req.route?.path ?? req.url,
      source: 'api',
    };

    auditContextStorage.run(ctx, () => next());
  }
}
