import { z } from "zod";
import { uuidSchema, timestampSchema, nonEmptyString } from "./base";

export const sdkKeySchema = z.object({
	id: uuidSchema,
	environmentId: uuidSchema,
	name: nonEmptyString,
	type: z.enum(["client", "server"]),
	keyHint: z.string(),
	maskedKey: z.string(),
	isActive: z.boolean(),
	createdAt: timestampSchema,
	lastUsedAt: timestampSchema.nullable().optional(),
	creator: z
		.object({
			id: z.string(),
			name: z.string(),
			email: z.string(),
			image: z.string().nullable().optional(),
		})
		.nullable()
		.optional(),
});

export type SdkKey = z.infer<typeof sdkKeySchema>;
