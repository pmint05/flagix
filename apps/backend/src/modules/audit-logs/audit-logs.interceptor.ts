import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditLogsService } from './audit-logs.service';

@Injectable()
export class AuditLogsInterceptor implements NestInterceptor {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap((responseData) => {
        try {
          const user = request.user;
          const path = request.route?.path ?? request.url;

          if (!path?.startsWith('/api/v1/')) return;

          const {
            entityType,
            actionType,
            entityId,
            organizationId,
            projectId,
          } = this.extractAuditInfo(path, method, request.params);

          if (!entityType || !actionType) return;

          this.auditLogsService
            .record({
              organizationId: organizationId ?? '',
              projectId,
              actionType,
              entityType,
              entityId: entityId ?? responseData?.id ?? '',
              actorId: user?.id,
              actorType: 'user',
              actorEmail: user?.email,
              changes: {
                before: ['PATCH', 'PUT'].includes(method) ? request.body : null,
                after: responseData ?? null,
              },
            })
            .catch(() => {});
        } catch {
          // Audit logging should never break the request
        }
      }),
    );
  }

  private extractAuditInfo(
    path: string,
    method: string,
    params: Record<string, string>,
  ): {
    entityType?: string;
    actionType?: string;
    entityId?: string;
    organizationId?: string;
    projectId?: string;
  } {
    const actionMap: Record<string, string> = {
      POST: 'create',
      PATCH: 'update',
      PUT: 'update',
      DELETE: 'delete',
    };
    const action = actionMap[method] ?? 'update';

    if (path.includes('/rules')) {
      return {
        entityType: 'targeting_rule',
        actionType: `RULE_${action.toUpperCase()}`,
        entityId: params.ruleId,
        projectId: params.projectId,
      };
    }

    if (path.includes('/flags')) {
      return {
        entityType: 'feature_flag',
        actionType: `FLAG_${action.toUpperCase()}`,
        entityId: params.flagId,
        projectId: params.projectId,
      };
    }

    if (path.includes('/sdk-keys')) {
      return {
        entityType: 'sdk_key',
        actionType:
          action === 'delete'
            ? 'SDK_KEY_REVOKE'
            : `SDK_KEY_${action.toUpperCase()}`,
        entityId: params.keyId,
        projectId: params.projectId,
      };
    }

    if (path.includes('/environments')) {
      return {
        entityType: 'environment',
        actionType: `ENV_${action.toUpperCase()}`,
        entityId: params.envId,
        projectId: params.projectId,
      };
    }

    if (path.includes('/projects')) {
      return {
        entityType: 'project',
        actionType: `PROJECT_${action.toUpperCase()}`,
        entityId: params.projectId,
      };
    }

    if (path.includes('/organizations')) {
      return {
        entityType: 'organization',
        actionType: `ORG_${action.toUpperCase()}`,
        entityId: params.organizationId,
      };
    }

    return {};
  }
}
