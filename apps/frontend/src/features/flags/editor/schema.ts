import { z } from "zod";

const killSwitchConditionsSchema = z.object({}).optional();
const userConditionsSchema = z.object({
	operator: z.enum(["in", "not_in"]),
	userIds: z
		.array(
			z
				.string()
				.transform((v) => v.trim())
				.refine((v) => v.length > 0, "User ID cannot be empty"),
		)
		.min(1, "At least one user ID is required"),
});
const roleConditionsSchema = z.object({
	operator: z.enum(["in", "not_in"]),
	roles: z
		.array(
			z
				.string()
				.transform((v) => v.trim())
				.refine((v) => v.length > 0, "Role cannot be empty"),
		)
		.min(1, "At least one role is required"),
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

const customConditionSchema = z
	.object({
		contextKey: z
			.string()
			.transform((val) => val.trim())
			.refine((val) => val.length > 0, "Context key is required"),
		type: z.enum(["string", "number", "boolean", "object", "array"]),
		operator: z.string().min(1, "Operator is required"),
		values: z.array(z.any()).optional(), // for multi-value operators
		value: z.any().optional(), // for single-value operators
	})
	.superRefine((data, ctx) => {
		const MULTI_VALUE_OPERATORS = ["is_one_of", "is_not_one_of"];
		const NO_VALUE_OPERATORS = ["is_empty", "is_not_empty"];

		if (NO_VALUE_OPERATORS.includes(data.operator)) {
			return;
		}

		if (MULTI_VALUE_OPERATORS.includes(data.operator)) {
			if (!data.values || data.values.length === 0) {
				ctx.addIssue({
					code: "custom",
					message: "At least one value is required",
					path: ["values"],
				});
			} else {
				data.values.forEach((val, idx) => {
					if (val === undefined || val === null || String(val).trim() === "") {
						ctx.addIssue({
							code: "custom",
							message: "Value cannot be empty",
							path: ["values", idx],
						});
					} else if (data.type === "number") {
						const num = Number(val);
						if (isNaN(num)) {
							ctx.addIssue({
								code: "custom",
								message: "Value must be a number",
								path: ["values", idx],
							});
						}
					}
				});
			}
		} else {
			const val = data.value;
			if (val === undefined || val === null || String(val).trim() === "") {
				ctx.addIssue({
					code: "custom",
					message: "Value is required",
					path: ["value"],
				});
			} else if (data.type === "number") {
				const num = Number(val);
				if (isNaN(num)) {
					ctx.addIssue({
						code: "custom",
						message: "Value must be a number",
						path: ["value"],
					});
				}
			} else if (data.type === "object") {
				if (typeof val === "string") {
					try {
						JSON.parse(val);
					} catch {
						ctx.addIssue({
							code: "custom",
							message: "Value must be a valid JSON object",
							path: ["value"],
						});
					}
				}
			}
		}
	});

const customConditionsSchema = z.object({
	conditions: z
		.array(customConditionSchema)
		.min(1, "At least one condition is required"),
});

export const flagEditorFormSchema = z
	.object({
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
					variationId: z
						.string()
						.min(1, "Please select a variation")
						.optional(), // optional for multi-rollouts
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
				key: z
					.string()
					.transform((val) => val.trim())
					.refine((val) => val.length > 0, "Key is required"),
				name: z.string().optional(),
				description: z.string().optional().nullable(),
				value: z
					.any()
					.transform((val) => (typeof val === "string" ? val.trim() : val))
					.refine(
						(val) => val !== undefined && val !== null && val !== "",
						"Value is required",
					),
				isDefault: z.boolean().optional(),
				color: z.string().nullable().optional(),
			}),
		),
	})
	.superRefine((data, ctx) => {
		const validVariationIds = new Set(data.variations.map((v) => v.id));

		if (
			data.defaultVariationId &&
			!validVariationIds.has(data.defaultVariationId)
		) {
			ctx.addIssue({
				code: "custom",
				message: "Default variation does not exist",
				path: ["defaultVariationId"],
			});
		}

		if (data.offVariationId && !validVariationIds.has(data.offVariationId)) {
			ctx.addIssue({
				code: "custom",
				message: "Off variation does not exist",
				path: ["offVariationId"],
			});
		}

		data.rules.forEach((rule, ruleIdx) => {
			if (rule.ruleType !== "percentage") {
				if (!rule.variationId || !validVariationIds.has(rule.variationId)) {
					ctx.addIssue({
						code: "custom",
						message: "Selected variation does not exist",
						path: ["rules", ruleIdx, "variationId"],
					});
				}
			} else {
				const rollouts = rule.conditions?.rollouts;
				if (rollouts && Array.isArray(rollouts)) {
					let total = 0;
					rollouts.forEach((r, rolloutIdx) => {
						total += r.percentage || 0;
						if (!r.variationId || !validVariationIds.has(r.variationId)) {
							ctx.addIssue({
								code: "custom",
								message: "Selected variation does not exist",
								path: [
									"rules",
									ruleIdx,
									"conditions",
									"rollouts",
									rolloutIdx,
									"variationId",
								],
							});
						}
					});
					if (total > 100) {
						ctx.addIssue({
							code: "custom",
							message: `Total rollout percentage cannot exceed 100% (currently ${total}%)`,
							path: ["rules", ruleIdx, "conditions"],
						});
					}
				}
			}
		});
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
	user: "default",
	role: "default",
	percentage: "success",
	custom: "accent",
};
