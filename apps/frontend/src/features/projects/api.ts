import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
	type Project,
	
	projectSchema,
} from "@/types";
import { z } from "zod";
import { useContextStore } from "@/stores";

export interface CreateProjectInput {
	name: string;
	description?: string;
}

export interface UpdateProjectInput {
	name?: string;
	description?: string;
}

export const createProjectsApi = (orgId: string) => {
	const basePath = `organizations/${orgId}/projects`;
	return {
		list: (): Promise<Project[]> =>
			api.get(basePath, {
				schema: z.object({ projects: z.array(projectSchema), total: z.number() }),
			}).then(res => res.projects),
		get: (id: string): Promise<Project> =>
			api.get(`${basePath}/${id}`, { schema: projectSchema }),
		create: (input: CreateProjectInput): Promise<Project> =>
			api.post(basePath, { json: input, schema: projectSchema }),
		update: (id: string, input: UpdateProjectInput): Promise<Project> =>
			// Note: The backend uses PATCH for update
			api.patch(`${basePath}/${id}`, { json: input, schema: projectSchema }),
		delete: (id: string): Promise<void> =>
			api.delete(`${basePath}/${id}`).then(() => {}),
	};
};

// --- Query Hooks ---

export const PROJECTS_KEY = ["projects"] as const;

export function useProjects() {
	const orgId = useContextStore((s) => s.selectedOrganization?.id);

	return useQuery({
		queryKey: [...PROJECTS_KEY, orgId],
		queryFn: () => createProjectsApi(orgId!).list(),
		enabled: !!orgId,
	});
}

export function useProject(id: string) {
	const orgId = useContextStore((s) => s.selectedOrganization?.id);
	return useQuery({
		queryKey: [...PROJECTS_KEY, "detail", orgId, id],
		queryFn: () => createProjectsApi(orgId!).get(id),
		enabled: !!orgId && !!id,
	});
}

export function useCreateProject() {
	const queryClient = useQueryClient();
	const orgId = useContextStore((s) => s.selectedOrganization?.id);

	return useMutation({
		mutationFn: (input: CreateProjectInput) => {
			if (!orgId) throw new Error("No organization selected");
			return createProjectsApi(orgId).create(input);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [...PROJECTS_KEY, orgId] });
		},
	});
}

export function useUpdateProject() {
	const queryClient = useQueryClient();
	const orgId = useContextStore((s) => s.selectedOrganization?.id);

	return useMutation({
		mutationFn: ({ id, ...input }: UpdateProjectInput & { id: string }) => {
			if (!orgId) throw new Error("No organization selected");
			return createProjectsApi(orgId).update(id, input);
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: [...PROJECTS_KEY, orgId] });
			queryClient.invalidateQueries({
				queryKey: [...PROJECTS_KEY, "detail", orgId, variables.id],
			});
		},
	});
}

export function useDeleteProject() {
	const queryClient = useQueryClient();
	const orgId = useContextStore((s) => s.selectedOrganization?.id);

	return useMutation({
		mutationFn: (id: string) => {
			if (!orgId) throw new Error("No organization selected");
			return createProjectsApi(orgId).delete(id);
		},
		onSuccess: (_, id) => {
			queryClient.invalidateQueries({ queryKey: [...PROJECTS_KEY, orgId] });
			queryClient.invalidateQueries({
				queryKey: [...PROJECTS_KEY, "detail", orgId, id],
			});
		},
	});
}
