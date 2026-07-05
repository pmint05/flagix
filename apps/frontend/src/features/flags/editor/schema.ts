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

const segmentConditionsSchema = z.object({
	operator: z.enum(["in", "not_in"]),
	segmentIds: z
		.array(z.string())
		.min(1, "At least one segment is required"),
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
		type: z.enum(["string", "number", "boolean", "object", "array", "semver", "date"]),
		operator: z.string().min(1, "Operator is required"),
		values: z.array(z.any()).optional(), // for multi-value and between operators
		value: z.any().optional(), // for single-value operators
	})
	.superRefine((data, ctx) => {
		const MULTI_VALUE_OPERATORS = ["is_one_of", "is_not_one_of", "contains_any", "contains_all", "in", "not_in"];
		const NO_VALUE_OPERATORS = ["is_empty", "is_not_empty"];
		const BETWEEN_OPERATOR = "between";

		if (NO_VALUE_OPERATORS.includes(data.operator)) {
			return;
		}

		// ── between: needs values[0] and values[1] ──────────────────────────────
		if (data.operator === BETWEEN_OPERATOR) {
			const vals = data.values || [];
			const v0 = vals[0];
			const v1 = vals[1];
			if (v0 === undefined || v0 === null || String(v0).trim() === "") {
				ctx.addIssue({ code: "custom", message: "Min value is required", path: ["values"] });
			}
			if (v1 === undefined || v1 === null || String(v1).trim() === "") {
				ctx.addIssue({ code: "custom", message: "Max value is required", path: ["values"] });
			}
			if (data.type === "number" && v0 !== undefined && v1 !== undefined) {
				const a = Number(v0), b = Number(v1);
				if (!isNaN(a) && !isNaN(b) && a >= b) {
					ctx.addIssue({ code: "custom", message: "Min must be less than Max", path: ["values"] });
				}
			}
			if (data.type === "date" && v0 && v1) {
				const a = new Date(v0).getTime(), b = new Date(v1).getTime();
				if (!isNaN(a) && !isNaN(b) && a >= b) {
					ctx.addIssue({ code: "custom", message: "Start date must be before end date", path: ["values"] });
				}
			}
			return;
		}

		// ── multi-value operators (tag input) ────────────────────────────────────
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
			return;
		}

		// ── single-value operators ───────────────────────────────────────────────
		const val = data.value;
		if (data.type === "boolean") {
			// boolean toggle always has a value (true/false)
			return;
		}
		if (data.type === "date") {
			// date picker returns a string; empty = not picked yet
			if (!val || String(val).trim() === "") {
				ctx.addIssue({ code: "custom", message: "Date is required", path: ["value"] });
			}
			return;
		}
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
	});


const customConditionsSchema = z
	.object({
		conditions: z
			.array(customConditionSchema)
			.min(1, "At least one condition is required"),
	})
	.superRefine((data, ctx) => {
		const seen = new Map<string, number>();
		data.conditions.forEach((cond, idx) => {
			const key = cond.contextKey?.trim();
			if (!key) return;
			if (seen.has(key)) {
				ctx.addIssue({
					code: "custom",
					message: `Duplicate context key: "${key}"`,
					path: ["conditions", idx, "contextKey"],
				});
			} else {
				seen.set(key, idx);
			}
		});
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
				z.object({
					id: z.string(),
					ruleType: z.literal("segment"),
					isEnabled: z.boolean(),
					variationId: z.string().min(1, "Please select a variation"),
					conditions: segmentConditionsSchema,
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
		).min(2, "At least 2 variations are required"),
	})
	.superRefine((data, ctx) => {
		const validVariationIds = new Set(data.variations.map((v) => v.id));

		// Validate unique variation keys
		const seenKeys = new Set<string>();
		data.variations.forEach((v, idx) => {
			if (seenKeys.has(v.key)) {
				ctx.addIssue({
					code: "custom",
					message: `Duplicate variation key: "${v.key}"`,
					path: ["variations", idx, "key"],
				});
			} else {
				seenKeys.add(v.key);
			}
		});

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

		// Cross-rule duplicate contextKey detection
		const keyToOccurrences = new Map<string, { ruleIdx: number; condIdx: number }[]>();
		data.rules.forEach((rule, ruleIdx) => {
			if (rule.ruleType === "custom" && rule.conditions?.conditions) {
				rule.conditions.conditions.forEach((cond, condIdx) => {
					const key = cond.contextKey?.trim();
					if (!key) return;
					const occurrences = keyToOccurrences.get(key) || [];
					occurrences.push({ ruleIdx, condIdx });
					keyToOccurrences.set(key, occurrences);
				});
			}
		});
		keyToOccurrences.forEach((occurrences, key) => {
			if (occurrences.length > 1) {
				const ruleLabels = [...new Set(occurrences.map((o) => `Rule ${o.ruleIdx + 1}`))].join(", ");
				occurrences.forEach(({ ruleIdx, condIdx }) => {
					ctx.addIssue({
						code: "custom",
						message: `Context key "${key}" is duplicated across ${ruleLabels}`,
						path: ["rules", ruleIdx, "conditions", "conditions", condIdx, "contextKey"],
					});
				});
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
	segment: "Segment Rule",
};

export const RULE_TYPE_COLORS: Record<string, string> = {
	kill_switch: "danger",
	user: "default",
	role: "default",
	percentage: "success",
	custom: "accent",
	segment: "secondary",
};
