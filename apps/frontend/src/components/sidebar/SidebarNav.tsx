import { useMatchRoute } from "@tanstack/react-router";
import {
	FlagIcon,
	TreeStructureIcon,
	KeyIcon,
	ClockCounterClockwiseIcon,
	ChartBarIcon,
	BroadcastIcon,
	ChartLineIcon,
	UsersThreeIcon,
} from "@phosphor-icons/react";
import { useContextStore, useSidebarStore } from "#/stores";
import { SidebarNavItem } from "./SidebarNavItem";
import { useHasPermission } from "@/hooks/usePermission";

const PROJECT_NAV_ITEMS = [
	{ to: "/projects/$projectSlug/flags", label: "Feature Flags", icon: FlagIcon },
	{ to: "/projects/$projectSlug/environments", label: "Environments", icon: TreeStructureIcon },
	{ to: "/projects/$projectSlug/sdk-keys", label: "SDK Keys", icon: KeyIcon },
	{ to: "/projects/$projectSlug/members", label: "Members", icon: UsersThreeIcon },
	{ to: "/projects/$projectSlug/analytics", label: "Project Analytics", icon: ChartLineIcon },
];

const GLOBAL_NAV_ITEMS = [
	{ to: "/analytics", label: "Analytics", icon: ChartBarIcon, keepSearch: false },
	{ to: "/live-events", label: "Live Events", icon: BroadcastIcon, keepSearch: false },
	{ to: "/audit-logs", label: "Audit Logs", icon: ClockCounterClockwiseIcon, keepSearch: false },
];

export function SidebarNav() {
	const { isCollapsed } = useSidebarStore();
	const selectedProject = useContextStore((s) => s.selectedProject);
	const matchRoute = useMatchRoute();

	const canViewFlags = useHasPermission("flag:view");
	const canViewEnvironments = useHasPermission("environment:view");
	const canViewSdkKeys = useHasPermission("sdk-key:view");
	const canViewMembers = useHasPermission("member:view");
	const canViewProjectAnalytics = useHasPermission("project:view");
	const canViewAuditLogs = useHasPermission("audit-log:view");

	const filteredProjectNavItems = PROJECT_NAV_ITEMS.filter((item) => {
		if (item.to.includes("flags")) return canViewFlags;
		if (item.to.includes("environments")) return canViewEnvironments;
		if (item.to.includes("sdk-keys")) return canViewSdkKeys;
		if (item.to.includes("members")) return canViewMembers;
		if (item.to.includes("analytics")) return canViewProjectAnalytics;
		return true;
	});

	const filteredGlobalNavItems = GLOBAL_NAV_ITEMS.filter((item) => {
		if (item.to.includes("audit-logs")) return canViewAuditLogs;
		if (item.to.includes("analytics")) return canViewProjectAnalytics;
		if (item.to.includes("live-events")) return canViewFlags;
		return true;
	});

	return (
		<nav className="flex-1 overflow-y-auto py-2 px-2 space-y-4">
			{/* Project Section */}
			<div className="space-y-1">
				{!isCollapsed && (
					<div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
						Project
					</div>
				)}
				{selectedProject ? (
					filteredProjectNavItems.map((item) => {
						const to = item.to.replace("$projectSlug", selectedProject.slug);
						const isActive = !!matchRoute({ to, fuzzy: true });
						return (
							<SidebarNavItem
								key={item.to}
								to={to}
								// keepSearch={item.keepSearch}
								label={item.label}
								icon={item.icon}
								isCollapsed={isCollapsed}
								isActive={isActive}
							/>
						);
					})
				) : (
					<div
						className={`px-3 py-2 text-sm transition-all ${
							isCollapsed ? "hidden" : "block"
						}`}>
						Select a project
					</div>
				)}
			</div>

			{/* Global Section */}
			<div className="space-y-1">
				{!isCollapsed && (
					<div className="px-3 mt-4 mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
						Global
					</div>
				)}
				{filteredGlobalNavItems.map((item) => {
					const isActive = !!matchRoute({ to: item.to, fuzzy: true });
					return (
						<SidebarNavItem
							key={item.to}
							to={item.to}
							label={item.label}
							icon={item.icon}
							isCollapsed={isCollapsed}
							isActive={isActive}
						/>
					);
				})}
			</div>
		</nav>
	);
}
