import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { type Environment, environmentSchema } from "@/types";
import { z } from "zod";
import { useContextStore, useIsHydrated } from "@/stores";
import { useCurrentProject } from "@/hooks/useCurrentProject";

export interface CreateEnvironmentInput {
	name: string;
	type: "development" | "staging" | "production" | "custom";
	description?: string;
}

export interface UpdateEnvironmentInput {
	name?: string;
	type?: "development" | "staging" | "production" | "custom";
	isActive?: boolean;
	description?: string;
}

export const createEnvironmentsApi = (orgId: string, projectId: string) => {
	const basePath = `organizations/${orgId}/projects/${projectId}/environments`;
	return {
		list: (): Promise<Environment[]> =>
			api
				.get(basePath, {
					schema: z.object({
						data: z.array(environmentSchema),
						total: z.number(),
					}),
				})
				.then((res) => res.data),
		get: (id: string): Promise<Environment> =>
			api.get(`${basePath}/${id}`, { schema: environmentSchema }),
		getBySlug: (slug: string): Promise<Environment> =>
			api.get(`${basePath}/by-slug/${slug}`, { schema: environmentSchema }),
		create: (input: CreateEnvironmentInput): Promise<Environment> =>
			api.post(basePath, { json: input, schema: environmentSchema }),
		update: (id: string, input: UpdateEnvironmentInput): Promise<Environment> =>
			api.patch(`${basePath}/${id}`, {
				json: input,
				schema: environmentSchema,
			}),
		delete: (id: string): Promise<void> =>
			api.delete(`${basePath}/${id}`).then(() => {}),
	};
};

// --- Query Hooks ---

export const ENVIRONMENTS_KEY = ["environments"] as const;

export function useEnvironments() {
	const orgId = useContextStore((s) => s.selectedOrganization?.id);
	const projectId = useCurrentProject()?.id;
	const isHydrated = useIsHydrated();

	return useQuery({
		queryKey: [...ENVIRONMENTS_KEY, orgId, projectId],
		queryFn: () => createEnvironmentsApi(orgId!, projectId!).list(),
		enabled: isHydrated && !!orgId && !!projectId,
		staleTime: 1000 * 60 * 5,
	});
}

export function useEnvironment(id: string) {
	const orgId = useContextStore((s) => s.selectedOrganization?.id);
	const projectId = useCurrentProject()?.id;

	return useQuery({
		queryKey: [...ENVIRONMENTS_KEY, "detail", orgId, projectId, id],
		queryFn: () => createEnvironmentsApi(orgId!, projectId!).get(id),
		enabled: !!orgId && !!projectId && !!id,
	});
}

export function useEnvironmentBySlug(slug: string | undefined) {
	const orgId = useContextStore((s) => s.selectedOrganization?.id);
	const projectId = useCurrentProject()?.id;

	return useQuery({
		queryKey: [...ENVIRONMENTS_KEY, "detail", orgId, projectId, "by-slug", slug],
		queryFn: () => createEnvironmentsApi(orgId!, projectId!).getBySlug(slug!),
		enabled: !!orgId && !!projectId && !!slug,
	});
}

export function useCreateEnvironment() {
	const queryClient = useQueryClient();
	const orgId = useContextStore((s) => s.selectedOrganization?.id);
	const projectId = useCurrentProject()?.id;

	return useMutation({
		mutationFn: (input: CreateEnvironmentInput) => {
			if (!orgId || !projectId) throw new Error("Missing context");
			return createEnvironmentsApi(orgId, projectId).create(input);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [...ENVIRONMENTS_KEY, orgId, projectId],
			});
		},
	});
}

export function useUpdateEnvironment() {
	const queryClient = useQueryClient();
	const orgId = useContextStore((s) => s.selectedOrganization?.id);
	const projectId = useCurrentProject()?.id;

	return useMutation({
		mutationFn: ({ id, ...input }: UpdateEnvironmentInput & { id: string }) => {
			if (!orgId || !projectId) throw new Error("Missing context");
			return createEnvironmentsApi(orgId, projectId).update(id, input);
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: [...ENVIRONMENTS_KEY, orgId, projectId],
			});
			queryClient.invalidateQueries({
				queryKey: [
					...ENVIRONMENTS_KEY,
					"detail",
					orgId,
					projectId,
					variables.id,
				],
			});
		},
	});
}

export function useDeleteEnvironment() {
	const queryClient = useQueryClient();
	const orgId = useContextStore((s) => s.selectedOrganization?.id);
	const projectId = useCurrentProject()?.id;

	return useMutation({
		mutationFn: (id: string) => {
			if (!orgId || !projectId) throw new Error("Missing context");
			return createEnvironmentsApi(orgId, projectId).delete(id);
		},
		onSuccess: (_, id) => {
			queryClient.invalidateQueries({
				queryKey: [...ENVIRONMENTS_KEY, orgId, projectId],
			});
			queryClient.invalidateQueries({
				queryKey: [...ENVIRONMENTS_KEY, "detail", orgId, projectId, id],
			});
		},
	});
}

export function useToggleEnvironmentActive() {
	const queryClient = useQueryClient();
	const orgId = useContextStore((s) => s.selectedOrganization?.id);
	const projectId = useCurrentProject()?.id;

	return useMutation({
		mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => {
			if (!orgId || !projectId) throw new Error("Missing context");
			return createEnvironmentsApi(orgId, projectId).update(id, { isActive });
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: [...ENVIRONMENTS_KEY, orgId, projectId],
			});
			queryClient.invalidateQueries({
				queryKey: [
					...ENVIRONMENTS_KEY,
					"detail",
					orgId,
					projectId,
					variables.id,
				],
			});
		},
	});
}
