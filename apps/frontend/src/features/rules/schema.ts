import { z } from "zod";

const conditionsSchema = z.record(z.string(), z.unknown());

const percentageDistributionSchema = z.object({
	variationId: z.uuid(),
	percentage: z.number().min(0).max(100),
});

export const createRuleSchema = z
	.object({
		ruleType: z.enum(["kill_switch", "user", "role", "percentage"]),
		environmentId: z.uuid(),
		variationId: z.uuid().optional(),
		conditions: conditionsSchema.default({}),
		isEnabled: z.boolean().default(true),
		percentageDistribution: z.array(percentageDistributionSchema).optional(),
	})
	.refine(
		(data) => {
			if (data.ruleType === "percentage" && data.percentageDistribution) {
				const sum = data.percentageDistribution.reduce((acc, p) => acc + p.percentage, 0);
				return Math.abs(sum - 100) < 0.01;
			}
			return true;
		},
		{
			message: "Percentage rollout must sum to exactly 100%",
			path: ["percentageDistribution"],
		},
	);

export type CreateRuleValues = z.infer<typeof createRuleSchema>;

export const updateRuleSchema = z.object({
	variationId: z.uuid().optional(),
	conditions: conditionsSchema.optional(),
	isEnabled: z.boolean().optional(),
	priority: z.string().optional(),
	percentageDistribution: z.array(percentageDistributionSchema).optional(),
});

export type UpdateRuleValues = z.infer<typeof updateRuleSchema>;

// Combined form type - used for both create and edit
export const ruleFormSchema = z.object({
	ruleType: z.enum(["kill_switch", "user", "role", "percentage"]),
	environmentId: z.uuid(),
	variationId: z.uuid().optional(),
	conditions: conditionsSchema,
	isEnabled: z.boolean(),
	percentageDistribution: z.array(percentageDistributionSchema).optional(),
});

export type RuleFormValues = z.infer<typeof ruleFormSchema>;
