import { z } from "zod";

const killSwitchConditionsSchema = z.object({}).optional();
const userConditionsSchema = z.object({
	operator: z.enum(["in", "not_in"]),
	userIds: z
		.array(z.string().min(1))
		.min(1, "At least one user ID is required"),
});
const roleConditionsSchema = z.object({
	operator: z.enum(["in", "not_in"]),
	roles: z.array(z.string().min(1)).min(1, "At least one role is required"),
});

const percentageRolloutSchema = z.object({
	variationId: z.string().min(1, "Please select a variation"),
	percentage: z
		.number()
		.int()
		.min(0)
		.max(100, "Percentage must be between 0 and 100"),
});

const percentageConditionsSchema = z.object({
	rollouts: z
		.array(percentageRolloutSchema)
		.min(1, "At least one rollout item is required")
		.optional(),
	percentage: z.number().int().min(0).max(100).optional(), // for backward compatibility
});

const customConditionSchema = z.object({
	contextKey: z.string().min(1, "Context key is required"),
	type: z.enum(["string", "number", "boolean", "object", "array"]),
	operator: z.string().min(1, "Operator is required"),
	values: z.array(z.any()).optional(), // for multi-value operators
	value: z.any().optional(), // for single-value operators
});

const customConditionsSchema = z.object({
	conditions: z
		.array(customConditionSchema)
		.min(1, "At least one condition is required"),
});

export const flagEditorFormSchema = z.object({
	isFlagOn: z.boolean(),
	offVariationId: z.string().optional().nullable(),
	defaultVariationId: z.string().min(1, "Please select a default variation"),
	rules: z.array(
		z.discriminatedUnion("ruleType", [
			z.object({
				id: z.string(),
				ruleType: z.literal("kill_switch"),
				isEnabled: z.boolean(),
				variationId: z.string().min(1, "Please select a variation"),
				conditions: killSwitchConditionsSchema,
			}),
			z.object({
				id: z.string(),
				ruleType: z.literal("user"),
				isEnabled: z.boolean(),
				variationId: z.string().min(1, "Please select a variation"),
				conditions: userConditionsSchema,
			}),
			z.object({
				id: z.string(),
				ruleType: z.literal("role"),
				isEnabled: z.boolean(),
				variationId: z.string().min(1, "Please select a variation"),
				conditions: roleConditionsSchema,
			}),
			z.object({
				id: z.string(),
				ruleType: z.literal("percentage"),
				isEnabled: z.boolean(),
				variationId: z.string().min(1, "Please select a variation").optional(), // optional for multi-rollouts
				conditions: percentageConditionsSchema,
			}),
			z.object({
				id: z.string(),
				ruleType: z.literal("custom"),
				isEnabled: z.boolean(),
				variationId: z.string().min(1, "Please select a variation"),
				conditions: customConditionsSchema,
			}),
		]),
	),
	variations: z.array(
		z.object({
			id: z.string(),
			key: z.string().optional(),
			name: z.string().optional(),
			description: z.string().optional().nullable(),
			value: z
				.any()
				.refine(
					(val) => val !== undefined && val !== null && val !== "",
					"Value is required",
				),
		}),
	),
});

export type FlagEditorFormValues = z.infer<typeof flagEditorFormSchema>;
export type RuleType = FlagEditorFormValues["rules"][number]["ruleType"];
export type Variation = FlagEditorFormValues["variations"][number];

export const RULE_TYPE_LABELS: Record<string, string> = {
	kill_switch: "Kill Switch",
	user: "Target Users",
	role: "Target Roles",
	percentage: "Percentage",
	custom: "Custom Rule",
};

export const RULE_TYPE_COLORS: Record<string, string> = {
	kill_switch: "danger",
	user: "primary",
	role: "secondary",
	percentage: "success",
	custom: "warning",
};
