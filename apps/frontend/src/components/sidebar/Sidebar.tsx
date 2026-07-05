import { useSidebarStore } from "#/stores";
import { SidebarHeader } from "./SidebarHeader";
import { SidebarNav } from "./SidebarNav";
import { SidebarFooter } from "./SidebarFooter";
import { CreateButton } from "./CreateButton";
import { cn, Separator } from "@heroui/react";

export function Sidebar() {
	const { isCollapsed } = useSidebarStore();

	return (
		<aside
			data-sidebar-collapsed={isCollapsed}
			className="flex h-full w-full flex-col bg-background dark:bg-background-tertiary">
			<SidebarHeader />
			<div
				className={cn("pt-2", {
					"px-2": !isCollapsed,
				})}>
				<CreateButton />
				<Separator orientation="horizontal" className="mt-2" />
			</div>
			<SidebarNav />
			<SidebarFooter />
		</aside>
	);
}
