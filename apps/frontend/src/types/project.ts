import { z } from "zod";
import { uuidSchema, timestampSchema, nonEmptyString, slugSchema } from "./base";

export const projectSchema = z.object({
	id: uuidSchema,
	organizationId: uuidSchema,
	name: nonEmptyString,
	slug: slugSchema,
	description: z.string().optional(),
	flagCount: z.number().int().nonnegative(),
	createdAt: timestampSchema,
	updatedAt: timestampSchema,
});

export type Project = z.infer<typeof projectSchema>;
