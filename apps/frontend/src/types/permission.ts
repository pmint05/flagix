import type { Role } from "./organization";

export type Action = "view" | "create" | "edit" | "delete" | "toggle";

export type Resource =
	| "project"
	| "flag"
	| "environment"
	| "sdk-key"
	| "audit-log"
	| "organization"
	| "member"
	| "segment";

export type Permission = `${Resource}:${Action}`;

export const VIEWER_PERMISSIONS: Permission[] = [
	"project:view",
	"flag:view",
	"environment:view",
	"organization:view",
	"member:view",
	"segment:view",
];

export const EDITOR_PERMISSIONS: Permission[] = [
	...VIEWER_PERMISSIONS,
	"project:create",
	"project:edit",
	"project:view",
	"flag:create",
	"flag:edit",
	"flag:toggle",
	"environment:create",
	"environment:edit",
	"sdk-key:view",
	"sdk-key:create",
	"sdk-key:delete",
	"segment:create",
	"segment:edit",
];

export const ADMIN_PERMISSIONS: Permission[] = [
	...EDITOR_PERMISSIONS,
	"project:delete",
	"flag:delete",
	"environment:delete",
	"sdk-key:view",
	"sdk-key:create",
	"sdk-key:delete",
	"audit-log:view",
	"organization:edit",
	"organization:delete",
	"member:create",
	"member:edit",
	"member:delete",
	"segment:delete",
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
	viewer: VIEWER_PERMISSIONS,
	editor: EDITOR_PERMISSIONS,
	admin: ADMIN_PERMISSIONS,
};

export function hasPermission(role: Role, permission: Permission): boolean {
	return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(
	role: Role,
	permissions: Permission[],
): boolean {
	return permissions.some((p) => hasPermission(role, p));
}

export function canDo(
	role: Role | null | undefined,
	action: Action,
	resource: Resource,
): boolean {
	if (!role) return false;
	const permission: Permission = `${resource}:${action}`;
	return hasPermission(role, permission);
}
