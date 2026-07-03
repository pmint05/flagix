import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
	type Organization,
	organizationSchema,
	type Invitation,
	type UserInvitation,
	invitationSchema,
	userInvitationSchema,
} from "@/types";
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
	createdAt: z.string().optional(),
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
	listInvitations: (orgId: string): Promise<Invitation[]> =>
		api.get(`organizations/${orgId}/invitations`, {
			schema: z.array(invitationSchema),
		}),
	invite: (
		orgId: string,
		email: string,
		role: "admin" | "editor" | "viewer",
	): Promise<{ success: boolean; message: string }> =>
		api.post(`organizations/${orgId}/invitations`, {
			json: { email, role },
			schema: z.object({
				success: z.boolean(),
				message: z.string(),
			}),
		}),
	cancelInvitation: (orgId: string, invitationId: string): Promise<void> =>
		api.delete(`organizations/${orgId}/invitations/${invitationId}`).then(() => {}),
	listUserInvitations: (): Promise<UserInvitation[]> =>
		api.get("organizations/invitations/pending", {
			schema: z.array(userInvitationSchema),
		}),
	acceptInvitation: (invitationId: string): Promise<void> =>
		api.post(`organizations/invitations/${invitationId}/accept`, {}).then(() => {}),
	rejectInvitation: (invitationId: string): Promise<void> =>
		api.post(`organizations/invitations/${invitationId}/reject`, {}).then(() => {}),
	updateMemberRole: (
		orgId: string,
		memberId: string,
		role: "admin" | "editor" | "viewer",
	): Promise<void> =>
		api.patch(`organizations/${orgId}/members/${memberId}`, {
			json: { role },
		}).then(() => {}),
	removeMember: (orgId: string, memberId: string): Promise<void> =>
		api.delete(`organizations/${orgId}/members/${memberId}`).then(() => {}),
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

export function useOrgInvitations(orgId: string) {
	return useQuery({
		queryKey: [...ORGANIZATIONS_KEY, "invitations", orgId],
		queryFn: () => organizationsApi.listInvitations(orgId),
		enabled: !!orgId,
	});
}

export function useCreateInvitation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ orgId, email, role }: { orgId: string; email: string; role: "admin" | "editor" | "viewer" }) =>
			organizationsApi.invite(orgId, email, role),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: [...ORGANIZATIONS_KEY, "invitations", variables.orgId],
			});
		},
	});
}

export function useCancelInvitation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ orgId, invitationId }: { orgId: string; invitationId: string }) =>
			organizationsApi.cancelInvitation(orgId, invitationId),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: [...ORGANIZATIONS_KEY, "invitations", variables.orgId],
			});
		},
	});
}

export function useUserInvitations() {
	return useQuery({
		queryKey: [...ORGANIZATIONS_KEY, "user-invitations"],
		queryFn: () => organizationsApi.listUserInvitations(),
		staleTime: 1000 * 30, // 30 seconds
	});
}

export function useAcceptInvitation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (invitationId: string) => organizationsApi.acceptInvitation(invitationId),
		onSuccess: () => {
			// Invalidate all org queries so switcher and layout lists reload
			queryClient.invalidateQueries({ queryKey: ORGANIZATIONS_KEY });
		},
	});
}

export function useRejectInvitation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (invitationId: string) => organizationsApi.rejectInvitation(invitationId),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [...ORGANIZATIONS_KEY, "user-invitations"],
			});
		},
	});
}

export function useUpdateMemberRole() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ orgId, memberId, role }: { orgId: string; memberId: string; role: "admin" | "editor" | "viewer" }) =>
			organizationsApi.updateMemberRole(orgId, memberId, role),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: [...ORGANIZATIONS_KEY, "users", variables.orgId],
			});
		},
	});
}

export function useRemoveMember() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ orgId, memberId }: { orgId: string; memberId: string }) =>
			organizationsApi.removeMember(orgId, memberId),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: [...ORGANIZATIONS_KEY, "users", variables.orgId],
			});
		},
	});
}
