import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@heroui/react";
import { api } from "@/lib/api";
import {
	type FeatureFlag,
	type FeatureFlagListItem,
	featureFlagSchema,
	featureFlagListItemSchema,
} from "@/types/feature-flag";
import { paginatedSchema, type Paginated } from "@/types/base";
import { useContextStore } from "@/stores";
import { useCurrentProject } from "@/hooks/useCurrentProject";

export interface CreateFlagInput {
	key: string;
	name: string;
	description?: string;
	flagType: "boolean" | "multivariate";
	visibility?: "all" | "client_only" | "server_only";
	variations?: Array<{
		key: string;
		value: boolean | string | Record<string, unknown>;
		description?: string;
	}>;
}

export interface UpdateFlagInput {
	name?: string;
	description?: string;
	visibility?: "all" | "client_only" | "server_only";
	isTemporary?: boolean;
	tags?: string[];
}

export interface UpdateFlagStateInput {
	isEnabled?: boolean;
	status?: "draft" | "active" | "archived";
}

export interface FlagListParams {
	q?: string;
	status?: string | string[];
	flagType?: string | string[];
	visibility?: string | string[];
	isTemporary?: boolean;
	creator?: string;
	createdAtFrom?: string;
	createdAtTo?: string;
	tags?: string | string[];
	sort?: string;
	page?: number;
	pageSize?: number;
}

export const createFlagsApi = (orgId: string, projectId: string) => {
	const basePath = `organizations/${orgId}/projects/${projectId}/flags`;
	return {
		list: (
			envId: string,
			params?: FlagListParams,
		): Promise<Paginated<FeatureFlagListItem>> => {
			const searchParams = new URLSearchParams();
			searchParams.append("envId", envId);
			for (const [key, value] of Object.entries(params ?? {})) {
				if (value === undefined || value === null) continue;
				if (Array.isArray(value)) {
					for (const item of value) searchParams.append(key, String(item));
				} else {
					searchParams.append(key, String(value));
				}
			}
			return api.get(basePath, {
				searchParams,
				schema: paginatedSchema(featureFlagListItemSchema),
			});
		},
		get: (flagId: string, envId?: string): Promise<FeatureFlag> =>
			api.get(`organizations/${orgId}/flags/${flagId}`, {
				searchParams: envId ? { envId } : {},
				schema: featureFlagSchema,
			}),
		getByKey: (key: string, envId?: string): Promise<FeatureFlag> =>
			api.get(`${basePath}/by-key/${key}`, {
				searchParams: envId ? { envId } : {},
				schema: featureFlagSchema,
			}),
		create: (input: CreateFlagInput): Promise<FeatureFlag> =>
			api.post(basePath, {
				json: input,
				schema: featureFlagSchema,
			}),
		update: (flagId: string, input: UpdateFlagInput): Promise<FeatureFlag> =>
			api.patch(`organizations/${orgId}/flags/${flagId}`, {
				json: input,
				schema: featureFlagSchema,
			}),
		updateState: (flagId: string, envId: string, input: UpdateFlagStateInput) =>
			api.patch(
				`organizations/${orgId}/flags/${flagId}/environments/${envId}/state`,
				{
					json: input,
				},
			),
		patchConfig: (
			flagId: string,
			envId: string,
			input: any,
		): Promise<FeatureFlag> =>
			api.patch(
				`organizations/${orgId}/flags/${flagId}/environments/${envId}/config`,
				{
					json: input,
					schema: featureFlagSchema,
				},
			),
		delete: (flagId: string): Promise<void> =>
			api.delete(`organizations/${orgId}/flags/${flagId}`).then(() => {}),
	};
};

// --- Query Hooks ---

export const FLAGS_KEY = ["flags"] as const;

export function useFlags(params?: FlagListParams) {
	const orgId = useContextStore((s) => s.selectedOrganization?.id);
	const projectId = useCurrentProject()?.id;
	const envId = useContextStore((s) => s.selectedEnvironment?.id);

	return useQuery({
		queryKey: [...FLAGS_KEY, orgId, projectId, envId, params],
		queryFn: () => createFlagsApi(orgId!, projectId!).list(envId!, params),
		enabled: !!orgId && !!projectId && !!envId,
	});
}

export function useFlagByKey(key: string) {
	const orgId = useContextStore((s) => s.selectedOrganization?.id);
	const projectId = useCurrentProject()?.id;
	const envId = useContextStore((s) => s.selectedEnvironment?.id);

	return useQuery({
		queryKey: [...FLAGS_KEY, "detail", orgId, projectId, envId, key],
		queryFn: () => {
			if (!orgId || !projectId) throw new Error("Missing context");
			return createFlagsApi(orgId, projectId).getByKey(key, envId);
		},
		enabled: !!orgId && !!projectId && !!key,
	});
}

export function useCreateFlag() {
	const queryClient = useQueryClient();
	const orgId = useContextStore((s) => s.selectedOrganization?.id);
	const projectId = useCurrentProject()?.id;
	const envId = useContextStore((s) => s.selectedEnvironment?.id);

	return useMutation({
		mutationFn: (input: CreateFlagInput) => {
			if (!orgId || !projectId) throw new Error("Missing context");
			return createFlagsApi(orgId, projectId).create(input);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [...FLAGS_KEY, orgId, projectId, envId],
			});
		},
	});
}

export function useUpdateFlagState() {
	const queryClient = useQueryClient();
	const orgId = useContextStore((s) => s.selectedOrganization?.id);
	const projectId = useCurrentProject()?.id;
	const envId = useContextStore((s) => s.selectedEnvironment?.id);

	return useMutation({
		mutationFn: ({
			flagId,
			...input
		}: UpdateFlagStateInput & { flagId: string }) => {
			if (!orgId || !projectId || !envId) throw new Error("Missing context");
			return createFlagsApi(orgId, projectId).updateState(flagId, envId, input);
		},
		onMutate: async ({ flagId, isEnabled }) => {
			await queryClient.cancelQueries({
				queryKey: [...FLAGS_KEY, orgId, projectId, envId],
			});

			const previousData = queryClient.getQueryData<
				Paginated<FeatureFlagListItem>
			>([...FLAGS_KEY, orgId, projectId, envId]);

			queryClient.setQueryData<Paginated<FeatureFlagListItem>>(
				[...FLAGS_KEY, orgId, projectId, envId],
				(old) =>
					old
						? {
								...old,
								data: old.data.map((flag) =>
									flag.id === flagId
										? { ...flag, isEnabled: isEnabled ?? flag.isEnabled }
										: flag,
								),
							}
						: old,
			);

			return { previousData };
		},
		onError: (_err, _vars, context) => {
			toast.danger("Failed to update flag state", {
				description: "Your change has been reverted.",
			});

			if (context?.previousData) {
				queryClient.setQueryData(
					[...FLAGS_KEY, orgId, projectId, envId],
					context.previousData,
				);
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({
				queryKey: [...FLAGS_KEY, orgId, projectId, envId],
			});
			queryClient.invalidateQueries({
				queryKey: [...FLAGS_KEY, "detail", orgId, projectId, envId],
			});
		},
	});
}

export function useUpdateFlag() {
	const queryClient = useQueryClient();
	const orgId = useContextStore((s) => s.selectedOrganization?.id);

	return useMutation({
		mutationFn: ({
			flagId,
			...input
		}: UpdateFlagInput & { flagId: string }) => {
			if (!orgId) throw new Error("Missing context");
			return api.patch(`organizations/${orgId}/flags/${flagId}`, {
				json: input,
				schema: featureFlagSchema,
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [...FLAGS_KEY] });
		},
	});
}

export function useDeleteFlag() {
	const queryClient = useQueryClient();
	const orgId = useContextStore((s) => s.selectedOrganization?.id);
	const projectId = useCurrentProject()?.id;

	return useMutation({
		mutationFn: (flagId: string) => {
			if (!orgId || !projectId) throw new Error("Missing context");
			return createFlagsApi(orgId, projectId).delete(flagId);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [...FLAGS_KEY],
			});
		},
	});
}

export function usePatchFlagConfig() {
	const queryClient = useQueryClient();
	const orgId = useContextStore((s) => s.selectedOrganization?.id);
	const projectId = useCurrentProject()?.id;
	const envId = useContextStore((s) => s.selectedEnvironment?.id);

	return useMutation({
		mutationFn: ({ flagId, ...input }: { flagId: string } & any) => {
			if (!orgId || !projectId || !envId) throw new Error("Missing context");
			return createFlagsApi(orgId, projectId).patchConfig(flagId, envId, input);
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: [...FLAGS_KEY, orgId, projectId, envId],
			});
			queryClient.invalidateQueries({
				queryKey: [...FLAGS_KEY, "detail", orgId, projectId, envId, data.key],
			});
			queryClient.invalidateQueries({
				queryKey: ["rules", orgId, data.id, envId],
			});
		},
	});
}

export function useSimulateFlag() {
	const orgId = useContextStore((s) => s.selectedOrganization?.id);

	return useMutation({
		mutationFn: async ({
			flagId,
			envId,
			context,
			flagConfig,
		}: {
			flagId: string;
			envId: string;
			context: any;
			flagConfig?: any;
		}) => {
			if (!orgId) throw new Error("Missing context");
			return api.post<any>(
				`organizations/${orgId}/flags/${flagId}/environments/${envId}/simulate`,
				{
					json: { context, flagConfig },
				},
			);
		},
	});
}

export function useTagsSearch(q: string) {
	const orgId = useContextStore((s) => s.selectedOrganization?.id);
	const projectId = useCurrentProject()?.id;

	return useQuery({
		queryKey: ["tags", orgId, projectId, q],
		queryFn: async (): Promise<string[]> => {
			if (!orgId || !projectId) return [];
			const res = await api.get<{ data: Array<{ name: string }> }>(
				`organizations/${orgId}/projects/${projectId}/tags`,
				{
					searchParams: { q },
				},
			);
			return res.data.map((t) => t.name);
		},
		enabled: !!orgId && !!projectId,
	});
}

export interface SegmentListItem {
	id: string;
	key: string;
	name: string;
	description?: string;
	conditions: any;
	conditionCount: number;
}

export function useProjectSegments(enabled = false) {
	const orgId = useContextStore((s) => s.selectedOrganization?.id);
	const projectId = useCurrentProject()?.id;

	return useQuery({
		queryKey: ["segments", orgId, projectId],
		queryFn: async (): Promise<SegmentListItem[]> => {
			if (!orgId || !projectId) return [];
			const res = await api.get<{ data: SegmentListItem[] }>(
				`organizations/${orgId}/projects/${projectId}/segments`,
			);
			return res.data;
		},
		enabled: enabled && !!orgId && !!projectId,
	});
}

export function useSegment(segmentSlug: string) {
	const orgId = useContextStore((s) => s.selectedOrganization?.id);
	const projectId = useCurrentProject()?.id;

	return useQuery({
		queryKey: ["segments", orgId, projectId, "detail", segmentSlug],
		queryFn: async (): Promise<SegmentListItem> => {
			if (!orgId || !projectId) throw new Error("Missing context");
			return api.get<SegmentListItem>(
				`organizations/${orgId}/projects/${projectId}/segments/${segmentSlug}`,
			);
		},
		enabled: !!orgId && !!projectId && !!segmentSlug,
	});
}

export function useCreateSegment() {
	const queryClient = useQueryClient();
	const orgId = useContextStore((s) => s.selectedOrganization?.id);
	const projectId = useCurrentProject()?.id;

	return useMutation({
		mutationFn: (input: {
			key: string;
			name: string;
			description?: string;
			conditions: any;
		}) => {
			if (!orgId || !projectId) throw new Error("Missing context");
			return api.post<SegmentListItem>(
				`organizations/${orgId}/projects/${projectId}/segments`,
				{ json: input },
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["segments", orgId, projectId],
			});
			queryClient.invalidateQueries({ queryKey: FLAGS_KEY });
		},
	});
}

export function useUpdateSegment() {
	const queryClient = useQueryClient();
	const orgId = useContextStore((s) => s.selectedOrganization?.id);
	const projectId = useCurrentProject()?.id;

	return useMutation({
		mutationFn: ({
			segmentId,
			...input
		}: {
			segmentId: string;
			segmentSlug?: string;
			name?: string;
			description?: string;
			conditions?: any;
		}) => {
			if (!orgId || !projectId) throw new Error("Missing context");
			return api.patch<SegmentListItem>(
				`organizations/${orgId}/projects/${projectId}/segments/${segmentId}`,
				{ json: input },
			);
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: ["segments", orgId, projectId],
			});
			queryClient.invalidateQueries({
				queryKey: [
					"segments",
					orgId,
					projectId,
					"detail",
					variables.segmentSlug,
				],
			});
			queryClient.invalidateQueries({ queryKey: FLAGS_KEY });
		},
	});
}

export function useDeleteSegment() {
	const queryClient = useQueryClient();
	const orgId = useContextStore((s) => s.selectedOrganization?.id);
	const projectId = useCurrentProject()?.id;

	return useMutation({
		mutationFn: (segmentId: string) => {
			if (!orgId || !projectId) throw new Error("Missing context");
			return api.delete(
				`organizations/${orgId}/projects/${projectId}/segments/${segmentId}`,
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["segments", orgId, projectId],
			});
			queryClient.invalidateQueries({ queryKey: FLAGS_KEY });
		},
	});
}

export function useProjectTags() {
	const orgId = useContextStore((s) => s.selectedOrganization?.id);
	const projectId = useCurrentProject()?.id;

	return useQuery({
		queryKey: ["tags", orgId, projectId],
		queryFn: async (): Promise<Array<{ id: string; name: string }>> => {
			if (!orgId || !projectId) return [];
			const res = await api.get<{ data: Array<{ id: string; name: string }> }>(
				`organizations/${orgId}/projects/${projectId}/tags`,
			);
			return res.data;
		},
		enabled: !!orgId && !!projectId,
	});
}

export function useDeleteTag() {
	const queryClient = useQueryClient();
	const orgId = useContextStore((s) => s.selectedOrganization?.id);
	const projectId = useCurrentProject()?.id;

	return useMutation({
		mutationFn: (tagId: string) => {
			if (!orgId || !projectId) throw new Error("Missing context");
			return api.delete(
				`organizations/${orgId}/projects/${projectId}/tags/${tagId}`,
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["tags", orgId, projectId] });
		},
	});
}
