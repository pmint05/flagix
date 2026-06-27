import { SIDEBAR_WIDTH_DEFAULT } from '#/constants/sidebar';
import { createPersistedStore } from './ssr';

interface SidebarState {
	/** Whether the sidebar is in collapsed (icon-only) mode. */
	isCollapsed: boolean;

	/** The explicit size of the sidebar when expanded (in pixels). */
	size: number;

	/** Whether the mobile drawer sidebar is open. */
	isDrawerOpen: boolean;

	/** Toggle collapsed state. */
	toggleCollapse: () => void;

	/** Explicitly set collapsed state. */
	setCollapsed: (collapsed: boolean) => void;

	/** Update the saved expanded size. */
	setSize: (size: number) => void;

	/** Open the mobile drawer. */
	openDrawer: () => void;

	/** Close the mobile drawer. */
	closeDrawer: () => void;

	/** Toggle the mobile drawer. */
	toggleDrawer: () => void;
}

export const useSidebarStore = createPersistedStore<SidebarState>(
	(set) => ({
		isCollapsed: false,
		size: SIDEBAR_WIDTH_DEFAULT,
		isDrawerOpen: false,
		toggleCollapse: () => set((s) => ({ isCollapsed: !s.isCollapsed })),
		setCollapsed: (isCollapsed) => set({ isCollapsed }),
		setSize: (size) => set({ size }),
		openDrawer: () => set({ isDrawerOpen: true }),
		closeDrawer: () => set({ isDrawerOpen: false }),
		toggleDrawer: () => set((s) => ({ isDrawerOpen: !s.isDrawerOpen })),
	}),
	{
		name: 'flagix.sidebar',
		partialize: (state) => {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { isDrawerOpen, ...persisted } = state;
			return persisted as SidebarState;
		},
	},
);
