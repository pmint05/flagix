import { useEffect } from "react";
import { Drawer } from "@heroui/react";
import { useSidebarStore } from "#/stores";
import { SidebarHeader } from "./SidebarHeader";
import { SidebarNav } from "./SidebarNav";
import { SidebarFooter } from "./SidebarFooter";

export function MobileSidebarDrawer() {
	const { isDrawerOpen, closeDrawer, setCollapsed } = useSidebarStore();

	// Force sidebar expanded when drawer opens (no PanelGroup on mobile)
	useEffect(() => {
		if (isDrawerOpen) setCollapsed(false);
	}, [isDrawerOpen, setCollapsed]);

	return (
		<Drawer
			isOpen={isDrawerOpen}
			onOpenChange={(open) => !open && closeDrawer()}>
			<Drawer.Backdrop>
				<Drawer.Content placement="left" className="p-0">
					<Drawer.Dialog className="p-0">
						<Drawer.Body className="p-0">
							<aside className="flex h-full w-full flex-col bg-background">
								<SidebarHeader />
								<SidebarNav />
								<SidebarFooter />
							</aside>
						</Drawer.Body>
					</Drawer.Dialog>
				</Drawer.Content>
			</Drawer.Backdrop>
		</Drawer>
	);
}
