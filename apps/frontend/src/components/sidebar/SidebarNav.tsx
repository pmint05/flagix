import { useMatchRoute } from "@tanstack/react-router";
import {
	FlagIcon,
	TreeStructureIcon,
	KeyIcon,
	ClockCounterClockwiseIcon,
} from "@phosphor-icons/react";
import { useContextStore, useSidebarStore } from "#/stores";
import { SidebarNavItem } from "./SidebarNavItem";

const PROJECT_NAV_ITEMS = [
	{
		to: "/projects/$projectSlug/flags",
		label: "Feature Flags",
		icon: FlagIcon,
	},
	{
		to: "/projects/$projectSlug/environments",
		label: "Environments",
		icon: TreeStructureIcon,
	},
	{ to: "/projects/$projectSlug/sdk-keys", label: "SDK Keys", icon: KeyIcon },
];

const GLOBAL_NAV_ITEMS = [
	{
		to: "/audit-logs",
		label: "Audit Logs",
		icon: ClockCounterClockwiseIcon,
		keepSearch: false,
	},
];

export function SidebarNav() {
	const { isCollapsed } = useSidebarStore();
	const selectedProject = useContextStore((s) => s.selectedProject);
	const matchRoute = useMatchRoute();

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
					PROJECT_NAV_ITEMS.map((item) => {
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
				{GLOBAL_NAV_ITEMS.map((item) => {
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
