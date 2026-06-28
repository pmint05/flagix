import { createFileRoute } from "@tanstack/react-router";
import { Skeleton } from "@heroui/react";
import { useAuditLogs } from "@/features/audit/api";
import { AuditFilter, type AuditFilters } from "@/features/audit/AuditFilter";
import { EmptyState } from "@/components/ui/EmptyState";
import { useMemo } from "react";
import { auditLogColumns } from "@/features/audit/columns";
import { DataTable } from "@/components/ui/data-table/DataTable";
import { useDataTableUrlSync } from "@/hooks/useDataTableUrlSync";
import type { CalendarDate } from "@internationalized/date";
import type { ColumnDef } from "@tanstack/react-table";
import type { AuditLog } from "@/types/audit-log";

export const Route = createFileRoute("/_authenticated/audit-logs")({
	component: AuditLogsIndex,
});

function AuditLogsIndex() {
	const { tableState, updateTableState } = useDataTableUrlSync({
		defaultPageSize: 15,
		whitelist: ["entityType", "actionType", "from", "to"],
	});

	const filters = tableState.filters as {
		entityType?: string;
		actionType?: string;
		from?: string;
		to?: string;
	};

	const queryParams = {
		limit: tableState.pageSize,
		offset: (tableState.page - 1) * tableState.pageSize,
		entityType: filters.entityType,
		actionType: filters.actionType,
		from: filters.from,
		to: filters.to,
	};

	const { data, isLoading, isError } = useAuditLogs(queryParams);

	const logs = data?.data ?? [];
	const total = data?.total ?? 0;
	const pageCount = Math.ceil(total / tableState.pageSize);

	const handleFilterChange = (newFilters: AuditFilters) => {
		const dateRange = newFilters.dateRange;
		updateTableState({
			filters: {
				entityType: newFilters.entityType,
				actionType: newFilters.actionType,
				from: dateRange?.start?.toString(),
				to: dateRange?.end?.toString(),
			},
			page: 1,
		});
	};

	const auditFilters: AuditFilters = useMemo(
		() => ({
			entityType: filters.entityType,
			actionType: filters.actionType,
			dateRange:
				filters.from || filters.to
					? {
							start: filters.from as unknown as CalendarDate,
							end: filters.to as unknown as CalendarDate,
						}
					: null,
		}),
		[filters],
	);

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
				<p className="mt-1 text-sm text-default-500">
					View a chronological log of all changes across your organization.
				</p>
			</div>

			<AuditFilter filters={auditFilters} onChange={handleFilterChange} />

			{isLoading ? (
				<div className="space-y-3">
					{Array.from({ length: 5 }).map((_, i) => (
						<Skeleton key={i} className="h-12 w-full rounded-lg" />
					))}
				</div>
			) : isError ? (
				<div className="rounded-lg border border-danger-200 bg-danger-50 p-4 text-danger">
					Failed to load audit logs. Please try again.
				</div>
			) : logs.length === 0 ? (
				<EmptyState
					title="No audit logs found"
					description="Try adjusting your filters or checking back later."
				/>
			) : (
				<DataTable
					data={logs}
					columns={auditLogColumns as ColumnDef<AuditLog, unknown>[]}
					state={tableState}
					onStateChange={updateTableState}
					pageCount={pageCount}
					rowCount={total}
					isCompact
					isHeaderSticky
				/>
			)}
		</div>
	);
}
