import { z } from "zod";
import { uuidSchema, timestampSchema } from "./base";

export const targetingRuleSchema = z.object({
	id: uuidSchema,
	flagId: uuidSchema,
	environmentId: uuidSchema,
	ruleType: z.enum(["kill_switch", "user", "role", "percentage"]),
	isEnabled: z.boolean(),
	priority: z.number().int().nonnegative(),
	conditions: z.record(z.string(), z.unknown()).optional(),
	variationId: uuidSchema,
	createdAt: timestampSchema,
	updatedAt: timestampSchema,
});

export type TargetingRule = z.infer<typeof targetingRuleSchema>;
