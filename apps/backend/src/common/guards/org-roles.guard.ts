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
    }>(PLATFORM_ORG_ROLES_KEY, [context.getHandler(), context.getClass()]);

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) throw new ForbiddenException('Not authenticated');

    // orgId is always available in params with new URL structure
    const orgId = request.params?.organizationId ?? request.params?.orgId;
    if (!orgId)
      throw new ForbiddenException('Organization ID not found in route');

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

    // If no metadata, just check membership
    if (!metadata) return true;

    // Check role requirement
    if (!metadata.roles.includes(membership.role)) {
      throw new ForbiddenException('Insufficient organization role');
    }

    return true;
  }
}
