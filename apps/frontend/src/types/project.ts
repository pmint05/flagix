import { z } from "zod";
import { uuidSchema, timestampSchema, nonEmptyString, slugSchema } from "./base";

export const projectSchema = z.object({
	id: uuidSchema,
	organizationId: uuidSchema,
	name: nonEmptyString,
	slug: slugSchema,
	description: z.string().optional().nullable(),
	flagCount: z.number().int().nonnegative().optional(),
	createdAt: timestampSchema,
	updatedAt: timestampSchema,
	deletedAt: timestampSchema.nullable().optional(),
});

export type Project = z.infer<typeof projectSchema>;
