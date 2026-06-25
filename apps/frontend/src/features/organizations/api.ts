import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { type Organization, organizationSchema } from "@/types";
import { z } from "zod";

export interface CreateOrganizationInput {
	name: string;
}

export interface UpdateOrganizationInput {
	name?: string;
}

export const organizationsApi = {
	list: (): Promise<Organization[]> =>
		api
			.get("organizations", {
				schema: z.object({
					organizations: z.array(organizationSchema),
					total: z.number(),
				}),
			})
			.then((res) => res.organizations),
	get: (id: string): Promise<Organization> =>
		api.get(`organizations/${id}`, { schema: organizationSchema }),
	create: (input: CreateOrganizationInput): Promise<Organization> =>
		api.post("organizations", { json: input, schema: organizationSchema }),
	update: (id: string, input: UpdateOrganizationInput): Promise<Organization> =>
		api.patch(`organizations/${id}`, {
			json: input,
			schema: organizationSchema,
		}),
	delete: (id: string): Promise<void> =>
		api.delete(`organizations/${id}`).then(() => {}),
};

// --- Query Hooks ---

export const ORGANIZATIONS_KEY = ["organizations"] as const;

export function useOrganizations() {
	return useQuery({
		queryKey: ORGANIZATIONS_KEY,
		queryFn: () => organizationsApi.list(),
	});
}

export function useOrganization(id: string) {
	return useQuery({
		queryKey: [...ORGANIZATIONS_KEY, "detail", id],
		queryFn: () => organizationsApi.get(id),
		enabled: !!id,
	});
}

export function useCreateOrganization() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: CreateOrganizationInput) =>
			organizationsApi.create(input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ORGANIZATIONS_KEY });
		},
	});
}

export function useUpdateOrganization() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, ...input }: UpdateOrganizationInput & { id: string }) =>
			organizationsApi.update(id, input),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: ORGANIZATIONS_KEY });
			queryClient.invalidateQueries({
				queryKey: [...ORGANIZATIONS_KEY, "detail", variables.id],
			});
		},
	});
}

export function useDeleteOrganization() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => organizationsApi.delete(id),
		onSuccess: (_, id) => {
			queryClient.invalidateQueries({ queryKey: ORGANIZATIONS_KEY });
			queryClient.invalidateQueries({
				queryKey: [...ORGANIZATIONS_KEY, "detail", id],
			});
		},
	});
}
