import { z } from "zod";
import { uuidSchema, timestampSchema, nonEmptyString } from "./base";

export const flagVariationDotSchema = z.object({
	id: uuidSchema,
	key: z.string(),
	color: z.string().nullable(),
});

export const variationSchema = z.object({
	id: uuidSchema,
	featureFlagId: uuidSchema,
	key: z.string().min(1).max(100),
	value: z.union([z.boolean(), z.string(), z.record(z.string(), z.unknown())]),
	description: z.string().nullable().optional(),
	isDefault: z.boolean().optional(),
	color: z.string().nullable().optional(),
});

export const flagStateSchema = z.object({
	id: uuidSchema,
	featureFlagId: uuidSchema,
	environmentId: uuidSchema,
	isEnabled: z.boolean(),
	status: z.enum(["draft", "active", "archived"]),
	version: z.number(),
	defaultVariationId: uuidSchema.nullable().optional(),
	offVariationId: uuidSchema.nullable().optional(),
	createdAt: timestampSchema,
	updatedAt: timestampSchema,
});

export const featureFlagSchema = z.object({
	id: uuidSchema,
	projectId: uuidSchema,
	organizationId: uuidSchema,
	key: z.string().regex(/^[a-zA-Z0-9_-]+$/).min(1).max(255),
	name: nonEmptyString,
	description: z.string().nullable().optional(),
	flagType: z.enum(["boolean", "multivariate"]),
	visibility: z.enum(["all", "client_only", "server_only"]).default("all"),
	version: z.number(),
	isTemporary: z.boolean().default(false),
	variations: z.array(variationSchema).optional(),
	states: z.array(flagStateSchema).optional(),
	createdBy: z.string().nullable().optional(),
	updatedBy: z.string().nullable().optional(),
	deletedBy: z.string().nullable().optional(),
	createdAt: timestampSchema,
	updatedAt: timestampSchema,
	deletedAt: timestampSchema.nullable().optional(),
});

export const flagCreatorSchema = z.object({
	id: z.string(),
	name: z.string(),
	email: z.string().nullable().optional(),
});

/** Flag list item with per-environment state merged in */
export const featureFlagListItemSchema = featureFlagSchema.extend({
	isEnabled: z.boolean(),
	status: z.enum(["draft", "active", "archived"]),
	environmentId: uuidSchema,
	stateId: uuidSchema,
	stateVersion: z.number(),
	creator: flagCreatorSchema.nullable().optional(),
	variationCount: z.number().int().nonnegative(),
	variations: z.array(flagVariationDotSchema),
});

export type Variation = z.infer<typeof variationSchema>;
export type FlagVariationDot = z.infer<typeof flagVariationDotSchema>;
export type FlagState = z.infer<typeof flagStateSchema>;
export type FlagCreator = z.infer<typeof flagCreatorSchema>;
export type FeatureFlag = z.infer<typeof featureFlagSchema>;
export type FeatureFlagListItem = z.infer<typeof featureFlagListItemSchema>;
