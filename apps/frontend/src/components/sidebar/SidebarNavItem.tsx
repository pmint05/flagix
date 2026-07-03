import { Link } from "@tanstack/react-router";
import { cn, Tooltip } from "@heroui/react";
import type React from "react";
import { useSidebarStore } from "#/stores";

import type { IconWeight } from "@phosphor-icons/react";

interface SidebarNavItemProps {
	to: string;
	label: string;
	icon: React.ComponentType<{
		size?: number;
		weight?: IconWeight;
		className?: string;
	}>;
	isCollapsed: boolean;
	isActive: boolean;
	keepSearch?: boolean;
}

export function SidebarNavItem({
	to,
	label,
	icon: Icon,
	isCollapsed,
	isActive,
	keepSearch: _keepSearch = false,
}: SidebarNavItemProps) {
	const closeDrawer = useSidebarStore((s) => s.closeDrawer);

	const content = (
		<Link
			to={to}
			// search={keepSearch ? (prev) => ({ ...prev }) : {}}
			onClick={closeDrawer}
			className={cn(
				"group flex items-center rounded-3xl py-2 transition-all duration-200 active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-accent w-full",
				{
					"justify-center px-0": isCollapsed,
					"gap-3 px-3": !isCollapsed,
					"bg-accent/10 text-accent font-medium": isActive,
					"text-default-foreground hover:bg-default": !isActive,
				},
			)}>
			<Icon
				size={20}
				weight={isActive ? "duotone" : "light"}
				className="shrink-0"
			/>
			<span
				className={cn(
					"truncate whitespace-nowrap transition-all duration-200 text-sm",
					{
						"w-0 opacity-0 pointer-events-none": isCollapsed,
						"w-auto opacity-100": !isCollapsed,
					},
				)}>
				{label}
			</span>
		</Link>
	);

	if (isCollapsed) {
		return (
			<Tooltip delay={0}>
				<Tooltip.Trigger className="w-full">
					<div className="w-full">{content}</div>
				</Tooltip.Trigger>
				<Tooltip.Content offset={6} placement="right">
					<span className="text-sm">{label}</span>
				</Tooltip.Content>
			</Tooltip>
		);
	}

	return content;
}
