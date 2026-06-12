import type { MemberRole } from '../schemas/enums';

export const ROLE_HIERARCHY = {
  viewer: 0,
  editor: 1,
  admin: 2,
} as const;

export function hasAtLeastRole(actual: MemberRole, required: MemberRole): boolean {
  return ROLE_HIERARCHY[actual] >= ROLE_HIERARCHY[required];
}
