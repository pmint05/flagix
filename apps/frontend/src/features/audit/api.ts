import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { type AuditLog, auditLogSchema } from "@/types/audit-log";
import { paginatedSchema, type Paginated } from "@/types/base";
import { useContextStore } from "@/stores";

export interface AuditLogQueryParams {
	projectId?: string;
	environmentId?: string;
	entityType?: string;
	entityId?: string;
	actionType?: string;
	limit?: number;
	offset?: number;
	from?: string;
	to?: string;
	actorId?: string;
	actorEmail?: string;
	search?: string;
	sort?: string;
	page?: number;
	pageSize?: number;
}

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
				schema: paginatedSchema(auditLogSchema),
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
