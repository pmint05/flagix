import { Link, useMatchRoute } from "@tanstack/react-router";
import {
	FlagIcon,
	FolderOpenIcon,
	ClockIcon,
	HashIcon,
	CaretLeftIcon,
	CaretRightIcon,
} from "@phosphor-icons/react";

interface SidebarProps {
	collapsed: boolean;
	onToggle: () => void;
}

const navItems = [
	{ to: "/projects", label: "Projects", icon: FolderOpenIcon },
	{ to: "/audit-logs", label: "Audit Logs", icon: ClockIcon },
];

const projectNavItems = [
	{ to: "/projects/$projectId/flags", label: "Feature Flags", icon: FlagIcon },
	{ to: "/projects/$projectId/environments", label: "Environments", icon: HashIcon },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
	const matchRoute = useMatchRoute();

	return (
		<aside
			className={`flex flex-col border-r border-default-200 bg-content1 transition-all duration-200 ${
				collapsed ? "w-16" : "w-60"
			}`}
		>
			<div className="flex h-14 items-center justify-between border-b border-default-200 px-3">
				{!collapsed && (
					<span className="text-lg font-bold text-foreground">Flagix</span>
				)}
				<button
					type="button"
					onClick={onToggle}
					className="rounded-md p-1.5 text-default-500 hover:bg-default-100"
				>
					{collapsed ? <CaretRightIcon size={18} /> : <CaretLeftIcon size={18} />}
				</button>
			</div>
			<nav className="flex-1 space-y-1 p-2">
				{navItems.map((item) => {
					const Icon = item.icon;
					const isActive = matchRoute({ to: item.to, fuzzy: item.to !== "/audit-logs" });
					return (
						<Link
							key={item.to}
							to={item.to}
							className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
								isActive
									? "bg-primary/10 text-primary"
									: "text-default-600 hover:bg-default-100"
							}`}
						>
							<Icon size={18} />
							{!collapsed && <span>{item.label}</span>}
						</Link>
					);
				})}
			</nav>
		</aside>
	);
}

export function ProjectSidebar({
	collapsed,
	projectId,
}: {
	collapsed: boolean;
	projectId: string;
}) {
	const matchRoute = useMatchRoute();

	return (
		<aside
			className={`flex flex-col border-r border-default-200 bg-content1 transition-all duration-200 ${
				collapsed ? "w-16" : "w-60"
			}`}
		>
			<div className="flex h-14 items-center border-b border-default-200 px-3">
				{!collapsed && (
					<span className="text-sm font-medium text-default-500">Project</span>
				)}
			</div>
			<nav className="flex-1 space-y-1 p-2">
				{projectNavItems.map((item) => {
					const Icon = item.icon;
					const to = item.to.replace("$projectId", projectId);
					const isActive = matchRoute({ to, fuzzy: true });
					return (
						<Link
							key={item.to}
							to={to}
							className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
								isActive
									? "bg-primary/10 text-primary"
									: "text-default-600 hover:bg-default-100"
							}`}
						>
							<Icon size={18} />
							{!collapsed && <span>{item.label}</span>}
						</Link>
					);
				})}
			</nav>
		</aside>
	);
}
