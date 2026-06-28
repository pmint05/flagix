import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@heroui/react";
import { api } from "@/lib/api";
import {
	type FeatureFlag,
	type FeatureFlagListItem,
	featureFlagSchema,
	featureFlagListItemSchema,
} from "@/types/feature-flag";
import { z } from "zod";
import { useContextStore } from "@/stores";
import { useCurrentProject } from "@/hooks/useCurrentProject";

export interface CreateFlagInput {
	key: string;
	name: string;
	description?: string;
	flagType: "boolean" | "multivariate";
	variations?: Array<{
		key: string;
		value: boolean | string | Record<string, unknown>;
		description?: string;
	}>;
}

export interface UpdateFlagInput {
	name?: string;
	description?: string;
}

export interface UpdateFlagStateInput {
	isEnabled?: boolean;
	status?: "draft" | "active" | "archived";
}

export const createFlagsApi = (
	orgId: string,
	projectId: string,
	envId: string,
) => {
	const basePath = `organizations/${orgId}/projects/${projectId}/environments/${envId}/flags`;
	return {
		list: (status?: string): Promise<FeatureFlagListItem[]> =>
			api
				.get(basePath, {
					searchParams: status ? { status } : undefined,
					schema: z.object({
						flags: z.array(featureFlagListItemSchema),
						total: z.number(),
					}),
				})
				.then((res) => res.flags),
		get: (flagId: string): Promise<FeatureFlag> =>
			api.get(`organizations/${orgId}/flags/${flagId}`, {
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
		updateState: (flagId: string, input: UpdateFlagStateInput) =>
			api.patch(
				`organizations/${orgId}/flags/${flagId}/environments/${envId}/state`,
				{
					json: input,
				},
			),
		delete: (flagId: string): Promise<void> =>
			api.delete(`organizations/${orgId}/flags/${flagId}`).then(() => {}),
	};
};

// --- Query Hooks ---

export const FLAGS_KEY = ["flags"] as const;

export function useFlags(status?: string) {
	const orgId = useContextStore((s) => s.selectedOrganization?.id);
	const projectId = useCurrentProject()?.id;
	const envId = useContextStore((s) => s.selectedEnvironment?.id);

	return useQuery({
		queryKey: [...FLAGS_KEY, orgId, projectId, envId, { status }],
		queryFn: () => createFlagsApi(orgId!, projectId!, envId!).list(status),
		enabled: !!orgId && !!projectId && !!envId,
	});
}

export function useFlag(flagId: string) {
	const orgId = useContextStore((s) => s.selectedOrganization?.id);

	return useQuery({
		queryKey: [...FLAGS_KEY, "detail", orgId, flagId],
		queryFn: () => {
			if (!orgId) throw new Error("No organization selected");
			return api.get(`organizations/${orgId}/flags/${flagId}`, {
				schema: featureFlagSchema,
			});
		},
		enabled: !!orgId && !!flagId,
	});
}

export function useCreateFlag() {
	const queryClient = useQueryClient();
	const orgId = useContextStore((s) => s.selectedOrganization?.id);
	const projectId = useCurrentProject()?.id;
	const envId = useContextStore((s) => s.selectedEnvironment?.id);

	return useMutation({
		mutationFn: (input: CreateFlagInput) => {
			if (!orgId || !projectId || !envId) throw new Error("Missing context");
			return createFlagsApi(orgId, projectId, envId).create(input);
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
			return createFlagsApi(orgId, projectId, envId).updateState(flagId, input);
		},
		onMutate: async ({ flagId, isEnabled }) => {
			await queryClient.cancelQueries({
				queryKey: [...FLAGS_KEY, orgId, projectId, envId],
			});

			const previousFlags = queryClient.getQueryData<FeatureFlagListItem[]>([
				...FLAGS_KEY,
				orgId,
				projectId,
				envId,
			]);

			queryClient.setQueryData<FeatureFlagListItem[]>(
				[...FLAGS_KEY, orgId, projectId, envId],
				(old) =>
					old?.map((flag) =>
						flag.id === flagId
							? { ...flag, isEnabled: isEnabled ?? flag.isEnabled }
							: flag,
					),
			);

			return { previousFlags };
		},
		onError: (_err, _vars, context) => {
			toast.danger("Failed to update flag state", {
				description: "Your change has been reverted.",
			});

			if (context?.previousFlags) {
				queryClient.setQueryData(
					[...FLAGS_KEY, orgId, projectId, envId],
					context.previousFlags,
				);
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({
				queryKey: [...FLAGS_KEY, orgId, projectId, envId],
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
	const envId = useContextStore((s) => s.selectedEnvironment?.id);

	return useMutation({
		mutationFn: (flagId: string) => {
			if (!orgId || !projectId || !envId) throw new Error("Missing context");
			return createFlagsApi(orgId, projectId, envId).delete(flagId);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [...FLAGS_KEY, orgId, projectId, envId],
			});
		},
	});
}
