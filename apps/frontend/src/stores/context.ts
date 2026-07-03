import { createPersistedStore } from './ssr';
import type { Organization, Project, Environment } from '@/types';

interface ContextState {
	selectedOrganization: Organization | null;
	selectedProject: Project | null;
	selectedEnvironment: Environment | null;
	setOrganization: (org: Organization | null) => void;
	setProject: (project: Project | null) => void;
	setEnvironment: (env: Environment | null) => void;
	clearContext: () => void;
}

export const useContextStore = createPersistedStore<ContextState>(
	(set) => ({
		selectedOrganization: null,
		selectedProject: null,
		selectedEnvironment: null,
		setOrganization: (org) => set((state) => {
			if (state.selectedOrganization?.id !== org?.id) {
				return {
					selectedOrganization: org,
					selectedProject: null,
					selectedEnvironment: null,
				};
			}
			return { selectedOrganization: org };
		}),
		setProject: (project) => set((state) => {
			if (state.selectedProject?.id !== project?.id) {
				return {
					selectedProject: project,
					selectedEnvironment: null,
				};
			}
			return { selectedProject: project };
		}),
		setEnvironment: (env) => set({ selectedEnvironment: env }),
		clearContext: () => set({
			selectedOrganization: null,
			selectedProject: null,
			selectedEnvironment: null,
		}),
	}),
	{ name: 'flagix.context' },
);
