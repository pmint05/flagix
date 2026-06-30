import { useContextStore } from "@/stores";
import type { Permission, Role, Resource, Action } from "@/types";
import { canDo, hasPermission, hasAnyPermission } from "@/types/permission";

export function useRole(): Role | null {
	const selectedOrganization = useContextStore((s) => s.selectedOrganization);
	return selectedOrganization?.role ?? null;
}

export function useHasPermission(permission: Permission): boolean {
	const role = useRole();
	if (!role) return false;
	return hasPermission(role, permission);
}

export function useHasAnyPermission(permissions: Permission[]): boolean {
	const role = useRole();
	if (!role) return false;
	return hasAnyPermission(role, permissions);
}

export function useCanDo(action: Action, resource: Resource): boolean {
	const role = useRole();
	return canDo(role, action, resource);
}

export function useIsAdmin(): boolean {
	const role = useRole();
	return role === "admin";
}

export function useIsEditor(): boolean {
	const role = useRole();
	return role === "editor";
}

export function useIsViewer(): boolean {
	const role = useRole();
	return role === "viewer";
}

export function useIsReadOnly(): boolean {
	const role = useRole();
	return role === "viewer";
}

export function useCanViewAuditLog(): boolean {
	return useHasPermission("audit-log:view");
}

export function useCanCreateProject(): boolean {
	return useHasPermission("project:create");
}

export function useCanEditProject(): boolean {
	return useHasPermission("project:edit");
}

export function useCanDeleteProject(): boolean {
	return useHasPermission("project:delete");
}

export function useCanCreateFlag(): boolean {
	return useHasPermission("flag:create");
}

export function useCanEditFlag(): boolean {
	return useHasPermission("flag:edit");
}

export function useCanDeleteFlag(): boolean {
	return useHasPermission("flag:delete");
}

export function useCanToggleFlag(): boolean {
	return useHasPermission("flag:toggle");
}

export function useCanManageSdkKey(): boolean {
	return useHasPermission("sdk-key:create") || useHasPermission("sdk-key:delete");
}

export function useCanViewSdkKey(): boolean {
	return useHasPermission("sdk-key:view");
}

export function useCanManageOrganization(): boolean {
	return useHasPermission("organization:edit") || useHasPermission("organization:delete");
}

export function useCanManageMembers(): boolean {
	return useHasPermission("member:create") || useHasPermission("member:edit") || useHasPermission("member:delete");
}

