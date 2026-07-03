/**
 * Invitations API — stub for future implementation.
 *
 * Backend endpoint not yet available. This file provides the interface
 * contract and placeholder hooks so the Sidebar "Invite Members" UI
 * can be wired up immediately when the API is ready.
 *
 * @module invitations-api
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";

export interface InviteMemberInput {
	email: string;
	role: "admin" | "editor" | "viewer";
}

export const INVITATIONS_KEY = ["invitations"] as const;

/**
 * Hook to invite a member to the current organization.
 *
 * @todo Wire up to backend endpoint when available:
 *   POST /organizations/:orgId/invitations { email, role }
 */
export function useInviteMember() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (_input: InviteMemberInput): Promise<void> => {
			// TODO: Replace with actual API call
			// const orgId = useContextStore.getState().selectedOrganization?.id;
			// if (!orgId) throw new Error("No organization selected");
			// await api.post(`organizations/${orgId}/invitations`, { json: input });
			throw new Error("Invite API not yet implemented");
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: INVITATIONS_KEY });
		},
	});
}
