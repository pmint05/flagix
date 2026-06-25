import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { auditContextStorage } from './audit-context';

interface RequestWithUser extends Request {
  user?: {
    id?: string;
    email?: string;
  } | null;
}

/**
 * Enhances the AsyncLocalStorage audit context with the authenticated
 * actor after the Better Auth guard has run.
 *
 * Better Auth sets `req.user` inside its AuthGuard, which executes AFTER
 * middleware. Therefore the initial AuditContextMiddleware cannot capture
 * the actor. This interceptor mutates the existing store so downstream
 * services see the correct actorId/actorEmail/actorType.
 */
@Injectable()
export class AuditContextEnhancerInterceptor implements NestInterceptor<
  any,
  any
> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (user?.id) {
      const ctx = auditContextStorage.getStore();
      if (ctx) {
        ctx.actorId = user.id;
        ctx.actorEmail = user.email;
        ctx.actorType = 'user';
      }
    }

    return next.handle();
  }
}
