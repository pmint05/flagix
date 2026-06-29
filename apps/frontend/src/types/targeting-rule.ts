import { z } from "zod";
import { uuidSchema, timestampSchema } from "./base";

export const targetingRuleSchema = z.object({
	id: uuidSchema,
	organizationId: uuidSchema,
	featureFlagId: uuidSchema,
	environmentId: uuidSchema,
	ruleType: z.enum(["kill_switch", "user", "role", "percentage", "custom"]),
	priority: z.string(),
	variationId: uuidSchema,
	conditions: z.record(z.string(), z.unknown()),
	isEnabled: z.boolean(),
	createdAt: timestampSchema,
	updatedAt: timestampSchema,
});

export type TargetingRule = z.infer<typeof targetingRuleSchema>;
