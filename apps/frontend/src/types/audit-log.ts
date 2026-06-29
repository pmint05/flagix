import { z } from "zod";

export const auditLogSchema = z.object({
	id: z.string(),
	actorId: z.string().nullable(),
	actorEmail: z.string().nullable(),
	actorType: z.enum(["user", "system"]),
	timestamp: z.coerce.date(),
	actionType: z.string(),
	entityType: z.enum([
		"organization",
		"project",
		"environment",
		"feature_flag",
		"targeting_rule",
		"flag_state",
		"variation",
		"sdk_key",
	]),
	entityId: z.string(),
	changes: z.record(z.string(), z.unknown()).nullable(),
	actorIp: z.string().nullable().optional(),
	userAgent: z.string().nullable().optional(),
	requestMethod: z.string().nullable().optional(),
	requestPath: z.string().nullable().optional(),
	source: z.enum(["web", "api", "sdk", "system"]).nullable().optional(),
	description: z.string().nullable().optional(),
	projectId: z.string().nullable().optional(),
	environmentId: z.string().nullable().optional(),
});

export type AuditLog = z.infer<typeof auditLogSchema>;
