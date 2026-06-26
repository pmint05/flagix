import { useSidebarStore } from '#/stores';
import { SidebarHeader } from './SidebarHeader';
import { SidebarNav } from './SidebarNav';
import { SidebarFooter } from './SidebarFooter';

export function Sidebar() {
	const { isCollapsed } = useSidebarStore();

	return (
		<aside
			data-sidebar-collapsed={isCollapsed}
			className="flex h-full w-full flex-col bg-background transition-[width] duration-300"
		>
			<SidebarHeader />
			<SidebarNav />
			<SidebarFooter />
		</aside>
	);
}
