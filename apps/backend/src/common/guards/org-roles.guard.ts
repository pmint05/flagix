import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { eq, and } from 'drizzle-orm';
import { PLATFORM_ORG_ROLES_KEY } from '../decorators/org-roles.decorator';
import { organizationMembers } from '@/db/schema';
import { DATABASE } from '@/modules/database/database.module';
import { type Database } from '@/db';

@Injectable()
export class OrgRolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(DATABASE) private readonly db: Database,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadata = this.reflector.getAllAndOverride<{
      roles: string[];
      options?: { orgIdParam?: string };
    }>(PLATFORM_ORG_ROLES_KEY, [context.getHandler(), context.getClass()]);

    if (!metadata) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) throw new ForbiddenException('Not authenticated');

    const orgId = this.resolveOrgId(request, metadata.options?.orgIdParam);
    if (!orgId) throw new ForbiddenException('Organization ID not found');

    const [membership] = await this.db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.userId, user.id),
          eq(organizationMembers.organizationId, orgId),
        ),
      )
      .limit(1);

    if (!membership)
      throw new ForbiddenException('Not a member of this organization');

    if (!metadata.roles.includes(membership.role)) {
      throw new ForbiddenException('Insufficient organization role');
    }

    return true;
  }

  private resolveOrgId(request: any, orgIdParam?: string): string | undefined {
    const paramName = orgIdParam ?? 'organizationId';
    return request.params?.[paramName] ?? request.body?.organizationId;
  }
}
