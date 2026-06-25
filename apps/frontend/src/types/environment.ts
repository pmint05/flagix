import { z } from "zod";
import { uuidSchema, timestampSchema, nonEmptyString, slugSchema } from "./base";

export const environmentSchema = z.object({
	id: uuidSchema,
	projectId: uuidSchema,
	name: nonEmptyString,
	slug: slugSchema,
	description: z.string().optional().nullable(),
	type: z.enum(["development", "staging", "production", "custom"]),
	isActive: z.boolean(),
	createdAt: timestampSchema,
	updatedAt: timestampSchema,
	deletedAt: timestampSchema.nullable().optional(),
});

export type Environment = z.infer<typeof environmentSchema>;
