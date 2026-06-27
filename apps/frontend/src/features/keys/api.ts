import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/api";
import { sdkKeySchema, type SdkKey } from "@/types/sdk-key";
import { useContextStore } from "@/stores";

export interface CreateSdkKeyInput {
	name: string;
	type: "client" | "server";
}

export interface CreateSdkKeyResponse extends SdkKey {
	rawKey: string;
}

const sdkKeyListSchema = z.object({
	sdkKeys: z.array(sdkKeySchema),
});

const sdkKeyCreateResponseSchema = sdkKeySchema.extend({
	rawKey: z.string(),
});

const successSchema = z.object({ success: z.boolean() });

const SDK_KEY_BASE = "organizations";

function basePath(orgId: string, envId: string) {
	return `${SDK_KEY_BASE}/${orgId}/environments/${envId}/sdk-keys`;
}

export const keysApi = {
	list: (orgId: string, envId: string): Promise<SdkKey[]> =>
		api
			.get(basePath(orgId, envId), { schema: sdkKeyListSchema })
			.then((r) => r.sdkKeys),

	create: (
		orgId: string,
		envId: string,
		input: CreateSdkKeyInput,
	): Promise<CreateSdkKeyResponse> =>
		api.post(basePath(orgId, envId), {
			json: input,
			schema: sdkKeyCreateResponseSchema,
		}),

	revoke: (orgId: string, envId: string, keyId: string): Promise<void> =>
		api
			.delete(`${basePath(orgId, envId)}/${keyId}`, { schema: successSchema })
			.then(() => {}),
};

// --- Query Hooks ---

export const SDK_KEY_LIST_KEY = ["sdk-keys"] as const;

export function useSdkKeys() {
	const orgId = useContextStore((s) => s.selectedOrganization?.id);
	const envId = useContextStore((s) => s.selectedEnvironment?.id);

	return useQuery({
		queryKey: [...SDK_KEY_LIST_KEY, orgId, envId],
		queryFn: () => keysApi.list(orgId!, envId!),
		enabled: !!orgId && !!envId,
	});
}

export function useCreateSdkKey() {
	const queryClient = useQueryClient();
	const orgId = useContextStore((s) => s.selectedOrganization?.id);
	const envId = useContextStore((s) => s.selectedEnvironment?.id);

	return useMutation({
		mutationFn: (input: CreateSdkKeyInput) => {
			if (!orgId || !envId) throw new Error("Missing context");
			return keysApi.create(orgId, envId, input);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [...SDK_KEY_LIST_KEY, orgId, envId],
			});
		},
	});
}

export function useRevokeSdkKey() {
	const queryClient = useQueryClient();
	const orgId = useContextStore((s) => s.selectedOrganization?.id);
	const envId = useContextStore((s) => s.selectedEnvironment?.id);

	return useMutation({
		mutationFn: (keyId: string) => {
			if (!orgId || !envId) throw new Error("Missing context");
			return keysApi.revoke(orgId, envId, keyId);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [...SDK_KEY_LIST_KEY, orgId, envId],
			});
		},
	});
}
