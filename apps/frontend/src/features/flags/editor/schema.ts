import { z } from "zod";

const killSwitchConditionsSchema = z.object({}).optional();
const userConditionsSchema = z.object({
	userIds: z.array(z.string().min(1)).min(1, "At least one user ID is required"),
});
const roleConditionsSchema = z.object({
	roles: z.array(z.string().min(1)).min(1, "At least one role is required"),
});
const percentageConditionsSchema = z.object({
	percentage: z.number().int().min(0).max(100),
});

export const flagEditorFormSchema = z.object({
	isFlagOn: z.boolean(),
	offVariationId: z.string().min(1, "Please select an off variation"),
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
				variationId: z.string().min(1, "Please select a variation"),
				conditions: percentageConditionsSchema,
			}),
		]),
	),
	variations: z.array(
		z.object({
			id: z.string(),
			key: z.string().min(1, "Variation key is required"),
			name: z.string().optional(),
			description: z.string().optional().nullable(),
			value: z.unknown(),
		}),
	),
});

export type FlagEditorFormValues = z.infer<typeof flagEditorFormSchema>;

export const RULE_TYPE_LABELS: Record<string, string> = {
	kill_switch: "Kill Switch",
	user: "Target Users",
	role: "Target Roles",
	percentage: "Percentage",
};

export const RULE_TYPE_COLORS: Record<string, string> = {
	kill_switch: "danger",
	user: "primary",
	role: "secondary",
	percentage: "success",
};
