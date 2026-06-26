import { SIDEBAR_WIDTH_DEFAULT } from '#/constants/sidebar';
import { createPersistedStore } from './ssr';

interface SidebarState {
	/** Whether the sidebar is in collapsed (icon-only) mode. */
	isCollapsed: boolean;

	/** The explicit size of the sidebar when expanded (in pixels). */
	size: number;

	/** Toggle collapsed state. */
	toggleCollapse: () => void;

	/** Explicitly set collapsed state. */
	setCollapsed: (collapsed: boolean) => void;

	/** Update the saved expanded size. */
	setSize: (size: number) => void;
}

export const useSidebarStore = createPersistedStore<SidebarState>(
	(set) => ({
		isCollapsed: false,
		size: SIDEBAR_WIDTH_DEFAULT,
		toggleCollapse: () => set((s) => ({ isCollapsed: !s.isCollapsed })),
		setCollapsed: (isCollapsed) => set({ isCollapsed }),
		setSize: (size) => set({ size }),
	}),
	{ name: 'flagix.sidebar' },
);
