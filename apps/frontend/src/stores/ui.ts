import { create } from 'zustand';

interface UIState {
	isGlobalLoading: boolean;
	globalLoadingMessage: string;
	showGlobalLoading: (message?: string) => void;
	hideGlobalLoading: () => void;
	setGlobalLoadingMessage: (message: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
	isGlobalLoading: false,
	globalLoadingMessage: "",
	showGlobalLoading: (message = "Loading...") => set({ isGlobalLoading: true, globalLoadingMessage: message }),
	hideGlobalLoading: () => set({ isGlobalLoading: false, globalLoadingMessage: "" }),
	setGlobalLoadingMessage: (message) => set({ globalLoadingMessage: message }),
}));
