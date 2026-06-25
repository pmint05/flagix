import { z } from "zod";
import { uuidSchema, timestampSchema } from "./base";

export const auditLogSchema = z.object({
	id: uuidSchema,
	actorId: uuidSchema,
	actorName: z.string(),
	actorType: z.enum(["user", "system"]),
	timestamp: timestampSchema,
	action: z.string(),
	entityType: z.enum([
		"organization",
		"project",
		"environment",
		"feature_flag",
		"targeting_rule",
		"variation",
		"sdk_key",
	]),
	entityId: uuidSchema,
	changes: z.record(z.string(), z.unknown()).optional(),
});

export type AuditLog = z.infer<typeof auditLogSchema>;
