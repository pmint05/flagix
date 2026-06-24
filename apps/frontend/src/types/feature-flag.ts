import { z } from "zod";
import { uuidSchema, timestampSchema, nonEmptyString } from "./base";

export const variationSchema = z.object({
	id: uuidSchema,
	flagId: uuidSchema,
	key: z.string().min(1).max(100),
	value: z.union([z.boolean(), z.string(), z.record(z.string(), z.unknown())]),
	description: z.string().optional(),
});

export const featureFlagSchema = z.object({
	id: uuidSchema,
	projectId: uuidSchema,
	key: z.string().regex(/^[a-zA-Z0-9_-]+$/).min(1).max(255),
	name: nonEmptyString,
	description: z.string().optional(),
	flagType: z.enum(["boolean", "multivariate"]),
	status: z.enum(["draft", "active", "archived"]),
	isEnabled: z.boolean(),
	variations: z.array(variationSchema).optional(),
	createdAt: timestampSchema,
	updatedAt: timestampSchema,
});

export type Variation = z.infer<typeof variationSchema>;
export type FeatureFlag = z.infer<typeof featureFlagSchema>;
