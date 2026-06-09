import { SetMetadata } from '@nestjs/common';

export const PLATFORM_ORG_ROLES_KEY = 'PLATFORM_ORG_ROLES';

export interface PlatformOrgRolesOptions {
  orgIdParam?: string;
}

export const PlatformOrgRoles = (
  roles: string[],
  options?: PlatformOrgRolesOptions,
) => SetMetadata(PLATFORM_ORG_ROLES_KEY, { roles, options });
