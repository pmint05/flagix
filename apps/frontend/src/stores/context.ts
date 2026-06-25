import { createPersistedStore } from './ssr';
import type { Organization, Project, Environment } from '@/types';

interface ContextState {
	selectedOrganization: Organization | null;
	selectedProject: Project | null;
	selectedEnvironment: Environment | null;
	setOrganization: (org: Organization | null) => void;
	setProject: (project: Project | null) => void;
	setEnvironment: (env: Environment | null) => void;
}

export const useContextStore = createPersistedStore<ContextState>(
	(set) => ({
		selectedOrganization: null,
		selectedProject: null,
		selectedEnvironment: null,
		setOrganization: (org) => set({ selectedOrganization: org }),
		setProject: (project) => set({ selectedProject: project }),
		setEnvironment: (env) => set({ selectedEnvironment: env }),
	}),
	{ name: 'flagix.context' },
);
