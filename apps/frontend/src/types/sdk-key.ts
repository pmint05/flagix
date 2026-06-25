import { z } from "zod";
import { uuidSchema, timestampSchema, nonEmptyString } from "./base";

export const sdkKeySchema = z.object({
	id: uuidSchema,
	environmentId: uuidSchema,
	name: nonEmptyString,
	type: z.enum(["client", "server"]),
	maskedKey: z.string(),
	isActive: z.boolean(),
	createdAt: timestampSchema,
});

export type SdkKey = z.infer<typeof sdkKeySchema>;
