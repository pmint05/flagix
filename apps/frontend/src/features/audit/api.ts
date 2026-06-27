import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { type AuditLog, auditLogSchema } from "@/types/audit-log";
import type { Paginated } from "@/types/base";
import { useContextStore } from "@/stores";
import { z } from "zod";

export interface AuditLogQueryParams {
	projectId?: string;
	environmentId?: string;
	entityType?: string;
	actionType?: string;
	limit?: number;
	offset?: number;
	from?: string;
	to?: string;
}

const auditLogListSchema = z.object({
	logs: z.array(auditLogSchema),
	total: z.number(),
	limit: z.number(),
	offset: z.number(),
}).transform((val) => ({
	data: val.logs,
	total: val.total,
	page: val.offset > 0 ? Math.floor(val.offset / val.limit) + 1 : 1,
	pageSize: val.limit,
}));

export const createAuditLogsApi = (orgId: string) => {
	const basePath = `organizations/${orgId}/audit-logs`;
	return {
		list: (params?: AuditLogQueryParams): Promise<Paginated<AuditLog>> => {
			const searchParams = new URLSearchParams();
			if (params) {
				Object.entries(params).forEach(([key, value]) => {
					if (value !== undefined && value !== "") {
						searchParams.append(key, value.toString());
					}
				});
			}

			return api.get(basePath, {
				searchParams,
				schema: auditLogListSchema,
			});
		},
		get: (id: string): Promise<AuditLog> =>
			api.get(`${basePath}/${id}`, { schema: auditLogSchema }),
	};
};

export const AUDIT_LOGS_KEY = ["audit-logs"] as const;

export function useAuditLogs(params?: AuditLogQueryParams) {
	const orgId = useContextStore((s) => s.selectedOrganization?.id);

	return useQuery({
		queryKey: [...AUDIT_LOGS_KEY, orgId, params],
		queryFn: () => createAuditLogsApi(orgId!).list(params),
		enabled: !!orgId,
	});
}

export function useAuditLog(id: string) {
	const orgId = useContextStore((s) => s.selectedOrganization?.id);

	return useQuery({
		queryKey: [...AUDIT_LOGS_KEY, "detail", orgId, id],
		queryFn: () => createAuditLogsApi(orgId!).get(id),
		enabled: !!orgId && !!id,
	});
}
