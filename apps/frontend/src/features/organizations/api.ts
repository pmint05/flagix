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

export const organizationUserSchema = z.object({
	id: z.string(),
	userId: z.string(),
	role: z.enum(["admin", "editor", "viewer"]),
	name: z.string(),
	email: z.string().nullable().optional(),
});

export type OrganizationUser = z.infer<typeof organizationUserSchema>;

export const organizationsApi = {
	list: (): Promise<Organization[]> =>
		api
			.get("organizations", {
				schema: z.object({
					data: z.array(organizationSchema),
					total: z.number(),
				}),
			})
			.then((res) => res.data),
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
	listUsers: (id: string): Promise<OrganizationUser[]> =>
		api
			.get(`organizations/${id}/users`, {
				schema: z.object({
					data: z.array(organizationUserSchema),
					total: z.number(),
				}),
			})
			.then((res) => res.data),
};

// --- Query Hooks ---

export const ORGANIZATIONS_KEY = ["organizations"] as const;

export function useOrganizations() {
	return useQuery({
		queryKey: ORGANIZATIONS_KEY,
		queryFn: () => organizationsApi.list(),
		staleTime: 1000 * 60 * 5,
	});
}

export function useOrganization(id: string) {
	return useQuery({
		queryKey: [...ORGANIZATIONS_KEY, "detail", id],
		queryFn: () => organizationsApi.get(id),
		enabled: !!id,
	});
}

export function useOrganizationUsers(orgId: string) {
	return useQuery({
		queryKey: [...ORGANIZATIONS_KEY, "users", orgId],
		queryFn: () => organizationsApi.listUsers(orgId),
		enabled: !!orgId,
		staleTime: 1000 * 60 * 5,
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
