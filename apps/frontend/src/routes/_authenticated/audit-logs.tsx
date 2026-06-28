import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@heroui/react";
import { useAuditLogs } from "@/features/audit/api";
import { AuditFilter, type AuditFilters } from "@/features/audit/AuditFilter";
import { useMemo } from "react";
import { auditLogColumns } from "@/features/audit/columns";
import { DataTable } from "@/components/ui/data-table/DataTable";
import { useDataTableUrlSync } from "@/hooks/useDataTableUrlSync";
import { parseDate } from "@internationalized/date";
import type { ColumnDef } from "@tanstack/react-table";
import type { AuditLog } from "@/types/audit-log";

export const Route = createFileRoute("/_authenticated/audit-logs")({
	component: AuditLogsIndex,
	staticData: {
		hideEnvironmentSwitcher: true,
	},
});

function AuditLogsIndex() {
	const { tableState, updateTableState } = useDataTableUrlSync({
		defaultPageSize: 10,
		whitelist: [
			"entityType",
			"actionType",
			"from",
			"to",
			"actorEmail",
			"entityId",
		],
	});

	const filters = tableState.filters as {
		entityType?: string;
		actionType?: string;
		from?: string;
		to?: string;
		actorEmail?: string;
		entityId?: string;
	};

	const queryParams = {
		limit: tableState.pageSize,
		offset: (tableState.page - 1) * tableState.pageSize,
		entityType: filters.entityType,
		actionType: filters.actionType,
		from: filters.from,
		to: filters.to,
		actorEmail: filters.actorEmail,
		entityId: filters.entityId,
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
				actorEmail: newFilters.actorEmail,
				entityId: newFilters.entityId,
			},
			page: 1, // When manually applying a filter, go to page 1
		});
	};

	const auditFilters: AuditFilters = useMemo(() => {
		let dateRange = null;
		if (filters.from && filters.to) {
			try {
				dateRange = {
					start: parseDate(filters.from),
					end: parseDate(filters.to),
				};
			} catch (e) {
				// Fallback if URL dates are malformed
			}
		}

		return {
			entityType: filters.entityType,
			actionType: filters.actionType,
			dateRange,
			actorEmail: filters.actorEmail,
			entityId: filters.entityId,
		};
	}, [filters]);

	const hasAnyFilter = Object.values(filters).some(
		(v) => v !== undefined && v !== "",
	);

	const handleClearAll = () => {
		updateTableState({
			filters: {},
			// specifically requested by user NOT to reset page/pageSize on clear all
		});
	};

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
				<p className="mt-1 text-sm text-default-500">
					View a chronological log of all changes across your organization.
				</p>
			</div>

			<div className="flex flex-col gap-4">
				<AuditFilter filters={auditFilters} onChange={handleFilterChange} />
				{hasAnyFilter && (
					<div className="flex justify-end">
						<Button variant="secondary" size="sm" onPress={handleClearAll}>
							Clear All Filters
						</Button>
					</div>
				)}
			</div>

			{isError ? (
				<div className="rounded-lg border border-danger-200 bg-danger-50 p-4 text-danger">
					Failed to load audit logs. Please try again.
				</div>
			) : (
				<DataTable
					isLoading={isLoading}
					data={logs}
					columns={auditLogColumns as ColumnDef<AuditLog, unknown>[]}
					state={tableState}
					onStateChange={updateTableState}
					pageCount={pageCount}
					rowCount={total}
					emptyMessage="No audit logs found for the selected filters."
					isCompact
					isHeaderSticky
					allowsResizing
					showPageJump
				/>
			)}
		</div>
	);
}
