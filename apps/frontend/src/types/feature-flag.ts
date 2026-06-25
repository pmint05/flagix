import { z } from "zod";
import { uuidSchema, timestampSchema, nonEmptyString } from "./base";

export const variationSchema = z.object({
	id: uuidSchema,
	flagId: uuidSchema,
	key: z.string().min(1).max(100),
	value: z.union([z.boolean(), z.string(), z.record(z.string(), z.unknown())]),
	description: z.string().optional(),
});

export const flagStateSchema = z.object({
	id: uuidSchema,
	featureFlagId: uuidSchema,
	environmentId: uuidSchema,
	isEnabled: z.boolean(),
	status: z.enum(["draft", "active", "archived"]),
	version: z.number(),
	createdAt: timestampSchema,
	updatedAt: timestampSchema,
});

export const featureFlagSchema = z.object({
	id: uuidSchema,
	projectId: uuidSchema,
	organizationId: uuidSchema,
	key: z.string().regex(/^[a-zA-Z0-9_-]+$/).min(1).max(255),
	name: nonEmptyString,
	description: z.string().optional(),
	flagType: z.enum(["boolean", "multivariate"]),
	version: z.number(),
	variations: z.array(variationSchema).optional(),
	states: z.array(flagStateSchema).optional(),
	createdAt: timestampSchema,
	updatedAt: timestampSchema,
});

/** Flag list item with per-environment state merged in */
export const featureFlagListItemSchema = featureFlagSchema.extend({
	isEnabled: z.boolean(),
	status: z.enum(["draft", "active", "archived"]),
	environmentId: uuidSchema,
	stateId: uuidSchema,
	stateVersion: z.number(),
});

export type Variation = z.infer<typeof variationSchema>;
export type FlagState = z.infer<typeof flagStateSchema>;
export type FeatureFlag = z.infer<typeof featureFlagSchema>;
export type FeatureFlagListItem = z.infer<typeof featureFlagListItemSchema>;
