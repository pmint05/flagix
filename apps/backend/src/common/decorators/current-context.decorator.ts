import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export class OrgContext {
  organizationId!: string;
  projectId?: string;
  envId?: string;
  flagId?: string;
  ruleId?: string;
  keyId?: string;
  logId?: string;
  role?: 'admin' | 'editor' | 'viewer';
}

export const CurrentContext = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): OrgContext => {
    const request = ctx.switchToHttp().getRequest();
    return {
      organizationId: request.params.organizationId,
      projectId: request.params.projectId,
      envId: request.params.envId,
      flagId: request.params.flagId,
      ruleId: request.params.ruleId,
      keyId: request.params.keyId,
      logId: request.params.logId,
      role: request.orgRole,
    };
  },
);
