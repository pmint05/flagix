import { z } from "zod";
import { uuidSchema, timestampSchema, nonEmptyString, slugSchema } from "./base";

export const organizationSchema = z.object({
	id: uuidSchema,
	name: nonEmptyString,
	slug: slugSchema,
	createdAt: timestampSchema,
	updatedAt: timestampSchema,
	role: z.enum(["admin", "editor", "viewer"]),
});

export type Organization = z.infer<typeof organizationSchema>;
