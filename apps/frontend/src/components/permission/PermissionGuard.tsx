import { type ReactNode, cloneElement, isValidElement } from "react";
import {
	useHasPermission,
	useHasAnyPermission,
	useRole,
} from "@/hooks/usePermission";
import type { Permission, Role, Resource, Action } from "@/types";

interface PermissionGuardProps {
	permission?: Permission;
	permissions?: Permission[];
	resource?: Resource;
	action?: Action;
	role?: Role;
	children: ReactNode;
	fallback?: ReactNode;
	mode?: "hide" | "disable";
}

export function PermissionGuard({
	permission,
	permissions,
	resource,
	action,
	role,
	children,
	fallback = null,
	mode = "hide",
}: PermissionGuardProps) {
	const hasRole = useRole();
	const noOrgSelected = hasRole === null;

	const permissionAllowed = permission ? useHasPermission(permission) : false;
	const anyPermissionAllowed = permissions
		? useHasAnyPermission(permissions)
		: false;
	const resourceActionAllowed =
		resource && action
			? useHasPermission(`${resource}:${action}` as Permission)
			: false;

	let allowed =
		permissionAllowed || anyPermissionAllowed || resourceActionAllowed;

	if (noOrgSelected) {
		allowed = false;
	}

	if (role && hasRole !== role) {
		allowed = false;
	}

	if (!allowed) {
		if (mode === "disable") {
			if (isValidElement(children)) {
				return (
					<>
						{cloneElement(children as React.ReactElement<any>, {
							isDisabled: true,
						})}
					</>
				);
			}
			return <>{fallback}</>;
		}
		return <>{fallback}</>;
	}

	return <>{children}</>;
}

export function withPermission<P extends object>(
	Component: React.ComponentType<P>,
	permission: Permission,
) {
	return function PermissionWrapper(props: P) {
		return (
			<PermissionGuard permission={permission}>
				<Component {...props} />
			</PermissionGuard>
		);
	};
}
