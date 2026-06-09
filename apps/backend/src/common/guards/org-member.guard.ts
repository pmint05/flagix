import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { organizationMembers } from '@/db/schema';
import { DATABASE } from '@/modules/database/database.module';
import { type Database } from '@/db';

@Injectable()
export class OrgMemberGuard implements CanActivate {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) throw new ForbiddenException('Not authenticated');

    const orgId = this.resolveOrgId(request);
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

    return true;
  }

  private resolveOrgId(request: any): string | undefined {
    return (
      request.params?.organizationId ??
      request.params?.orgId ??
      request.body?.organizationId
    );
  }
}
