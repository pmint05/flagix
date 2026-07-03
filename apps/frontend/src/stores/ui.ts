import { create } from 'zustand';

interface UIState {
	isGlobalLoading: boolean;
	globalLoadingMessage: string;
	showGlobalLoading: (message?: string) => void;
	hideGlobalLoading: () => void;
	setGlobalLoadingMessage: (message: string) => void;
	isProjectSettingsOpen: boolean;
	isOrgSettingsOpen: boolean;
	openProjectSettings: () => void;
	closeProjectSettings: () => void;
	openOrgSettings: () => void;
	closeOrgSettings: () => void;
}

export const useUIStore = create<UIState>((set) => ({
	isGlobalLoading: false,
	globalLoadingMessage: "",
	showGlobalLoading: (message = "Loading...") => set({ isGlobalLoading: true, globalLoadingMessage: message }),
	hideGlobalLoading: () => set({ isGlobalLoading: false, globalLoadingMessage: "" }),
	setGlobalLoadingMessage: (message) => set({ globalLoadingMessage: message }),
	isProjectSettingsOpen: false,
	isOrgSettingsOpen: false,
	openProjectSettings: () => set({ isProjectSettingsOpen: true }),
	closeProjectSettings: () => set({ isProjectSettingsOpen: false }),
	openOrgSettings: () => set({ isOrgSettingsOpen: true }),
	closeOrgSettings: () => set({ isOrgSettingsOpen: false }),
}));
