import { z } from "zod";
import { uuidSchema, timestampSchema } from "./base";

export const userSchema = z.object({
	id: uuidSchema,
	email: z.email(),
	name: z.string(),
	role: z.enum(["admin", "editor", "viewer"]),
	createdAt: timestampSchema,
	updatedAt: timestampSchema,
});

export type User = z.infer<typeof userSchema>;
