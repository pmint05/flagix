import { z } from "zod";

export const createRuleSchema = z.object({
	ruleType: z.enum(["kill_switch", "user", "role", "percentage"]),
	environmentId: z.uuid(),
	variationId: z.uuid(),
	conditions: z.record(z.string(), z.unknown()).default({}),
	isEnabled: z.boolean().default(true),
});

export type CreateRuleValues = z.infer<typeof createRuleSchema>;

export const updateRuleSchema = z.object({
	variationId: z.uuid().optional(),
	conditions: z.record(z.string(), z.unknown()).optional(),
	isEnabled: z.boolean().optional(),
	priority: z.string().optional(),
});

export type UpdateRuleValues = z.infer<typeof updateRuleSchema>;
