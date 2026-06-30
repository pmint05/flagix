import { z } from "zod";
import { flagTypeEnum, flagStatusEnum } from "./enums";
import { variationInputSchema } from "./variation";

export const createFeatureFlagSchema = z.object({
	key: z
		.string()
		.regex(/^[a-zA-Z0-9_-]+$/)
		.min(1)
		.max(255),
	name: z.string().min(1).max(255),
	description: z.string().optional(),
	flagType: flagTypeEnum,
	variations: z.array(variationInputSchema).optional(),
	defaultVariationKey: z.string().min(1).optional(),
	visibility: z.enum(["all", "client_only", "server_only"]).optional(),
	isTemporary: z.boolean().optional(),
});

export const updateFeatureFlagSchema = createFeatureFlagSchema
	.partial()
	.extend({
		version: z.number().int().positive().optional(),
	});

export const updateFlagStateSchema = z.object({
	isEnabled: z.boolean().optional(),
	status: flagStatusEnum.optional(),
	version: z.number().int().positive(),
});

export const featureFlagSchema = z.object({
	id: z.uuid(),
	organizationId: z.uuid(),
	projectId: z.uuid(),
	key: z.string(),
	name: z.string(),
	description: z.string().nullable(),
	flagType: flagTypeEnum,
	visibility: z.enum(["all", "client_only", "server_only"]),
	version: z.number().int(),
	isTemporary: z.boolean(),
	createdBy: z.string().nullable(),
	updatedBy: z.string().nullable(),
	deletedBy: z.string().nullable(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
	deletedAt: z.iso.datetime().nullable(),
});

export const featureFlagListItemSchema = featureFlagSchema.extend({
	isEnabled: z.boolean(),
	status: flagStatusEnum,
	environmentId: z.uuid(),
	stateId: z.uuid(),
	stateVersion: z.number().int(),
	creator: z
		.object({
			id: z.string(),
			name: z.string(),
			email: z.string().nullable(),
		})
		.nullable(),
	variationCount: z.number().int().nonnegative(),
	variations: z.array(
		z.object({
			id: z.uuid(),
			key: z.string(),
			color: z.string().nullable(),
		}),
	),
});

export const featureFlagListQuerySchema = z.object({
	envId: z.uuid(),
	q: z.string().max(255).optional(),
	status: z.union([flagStatusEnum, z.array(flagStatusEnum)]).optional(),
	flagType: z.union([flagTypeEnum, z.array(flagTypeEnum)]).optional(),
	visibility: z
		.union([
			z.enum(["all", "client_only", "server_only"]),
			z.array(z.enum(["all", "client_only", "server_only"])),
		])
		.optional(),
	isTemporary: z
		.union([z.boolean(), z.enum(["true", "false"])])
		.transform((v) => (typeof v === "boolean" ? v : v === "true"))
		.optional(),
	creator: z.string().optional(),
	createdAtFrom: z.iso.datetime().optional(),
	createdAtTo: z.iso.datetime().optional(),
	sort: z
		.string()
		.regex(/^[a-zA-Z_]+-(asc|desc)$/)
		.optional(),
	page: z
		.union([z.string(), z.number()])
		.transform((v) => Number(v))
		.pipe(z.number().int().positive())
		.optional(),
	pageSize: z
		.union([z.string(), z.number()])
		.transform((v) => Number(v))
		.pipe(z.number().int().positive().max(200))
		.optional(),
});

export const paginatedResponseSchema = <T extends z.ZodTypeAny>(
	itemSchema: T,
) =>
	z.object({
		data: z.array(itemSchema),
		total: z.number().int().nonnegative(),
		page: z.number().int().positive(),
		pageSize: z.number().int().positive(),
	});

export type FeatureFlag = z.infer<typeof featureFlagSchema>;
export type FeatureFlagListItem = z.infer<typeof featureFlagListItemSchema>;
export type FeatureFlagListQuery = z.infer<typeof featureFlagListQuerySchema>;
export type CreateFeatureFlag = z.infer<typeof createFeatureFlagSchema>;
export type UpdateFeatureFlag = z.infer<typeof updateFeatureFlagSchema>;
export type UpdateFlagState = z.infer<typeof updateFlagStateSchema>;
