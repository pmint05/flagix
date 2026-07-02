import { z } from "zod";
import { uuidSchema, timestampSchema } from "./base";
import { organizationSchema } from "./organization";

export const invitationSchema = z.object({
	id: uuidSchema,
	email: z.string().email(),
	role: z.enum(["admin", "editor", "viewer"]),
	status: z.enum(["pending", "accepted", "rejected", "cancelled"]),
	createdAt: timestampSchema,
	sender: z.object({
		id: z.string(),
		name: z.string(),
		email: z.string().email(),
	}),
});

export const userInvitationSchema = invitationSchema.extend({
	organization: organizationSchema.pick({ id: true, name: true, slug: true }),
});

export type Invitation = z.infer<typeof invitationSchema>;
export type UserInvitation = z.infer<typeof userInvitationSchema>;

export interface InviteMemberInput {
	email: string;
	role: "admin" | "editor" | "viewer";
}
