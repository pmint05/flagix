import { createFileRoute } from "@tanstack/react-router";
import { Button, SearchField, Popover, Checkbox } from "@heroui/react";
import { useAuditLogs } from "@/features/audit/api";
import { AuditFilter, type AuditFilters } from "@/features/audit/AuditFilter";
import { useMemo, useState, useEffect } from "react";
import { createAuditLogColumns } from "@/features/audit/columns";
import { AuditLogDetailModal } from "@/features/audit/AuditLogDetailModal";
import { DataTable } from "@/components/ui/data-table/DataTable";
import { useDataTableUrlSync } from "@/hooks/useDataTableUrlSync";
import { parseDate } from "@internationalized/date";
import type { AuditLog } from "@/types/audit-log";
import { useDebounce } from "@/hooks/useDebounce";
import { ColumnsIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useThemeStore } from "#/stores";

export const Route = createFileRoute("/_authenticated/audit-logs/")({
	component: AuditLogsIndex,
	staticData: {
		hideEnvironmentSwitcher: true,
	},
});

const ALL_COLUMNS = [
	{ id: "timestamp", label: "Timestamp" },
	{ id: "actor", label: "Actor" },
	{ id: "action", label: "Action" },
	{ id: "project", label: "Project" },
	{ id: "environment", label: "Environment" },
	{ id: "entityType", label: "Entity Type" },
	{ id: "entity", label: "Entity Name" },
	{ id: "entityId", label: "Entity ID" },
	{ id: "changes", label: "Changes" },
	{ id: "actorIp", label: "IP Address" },
	{ id: "userAgent", label: "User Agent" },
	{ id: "source", label: "Source" },
	{ id: "requestMethod", label: "HTTP Method" },
	{ id: "requestPath", label: "Request Path" },
];

function AuditLogsIndex() {
	const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
	const monacoTheme = resolvedTheme === "dark" ? "vs-dark" : "light";

	const { tableState, updateTableState } = useDataTableUrlSync({
		defaultPageSize: 10,
		whitelist: [
			"entityType",
			"actionType",
			"from",
			"to",
			"actorId",
			"entityId",
			"search",
			"visibleColumns",
			"projectId",
			"environmentId",
		],
	});

	const filters = tableState.filters as {
		entityType?: string;
		actionType?: string;
		from?: string;
		to?: string;
		actorId?: string;
		entityId?: string;
		visibleColumns?: string;
		projectId?: string;
		environmentId?: string;
	};

	const [searchQuery, setSearchQuery] = useState(tableState.query || "");
	const debouncedSearch = useDebounce(searchQuery, 300);

	const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
	const [isDetailOpen, setIsDetailOpen] = useState(false);

	useEffect(() => {
		if (debouncedSearch !== (tableState.query || "")) {
			updateTableState({ query: debouncedSearch, page: 1 });
		}
	}, [debouncedSearch, tableState.query, updateTableState]);

	useEffect(() => {
		setSearchQuery(tableState.query || "");
	}, [tableState.query]);

	const queryParams = {
		limit: tableState.pageSize,
		offset: (tableState.page - 1) * tableState.pageSize,
		entityType: filters.entityType,
		actionType: filters.actionType,
		from: filters.from,
		to: filters.to,
		actorId: filters.actorId,
		entityId: filters.entityId,
		projectId: filters.projectId,
		environmentId: filters.environmentId,
		search: tableState.query,
		sort:
			tableState.sortBy && tableState.sortDir
				? `${tableState.sortBy}-${tableState.sortDir}`
				: undefined,
		page: tableState.page,
		pageSize: tableState.pageSize,
	};

	const { data, isLoading, isError } = useAuditLogs(queryParams);

	const logs = data?.data ?? [];
	const total = data?.total ?? 0;
	const pageCount = Math.ceil(total / tableState.pageSize);

	const initialVisibleColumns = useMemo<Record<string, boolean>>(() => {
		const saved = filters.visibleColumns;
		if (!saved) {
			return {
				timestamp: true,
				actor: true,
				action: true,
				project: true,
				environment: true,
				entityType: true,
				entity: true,
				entityId: true,
				changes: true,
				actorIp: false,
				userAgent: false,
				source: false,
				requestMethod: false,
				requestPath: false,
			};
		}
		const list = saved.split(",");
		const config: Record<string, boolean> = {};
		ALL_COLUMNS.forEach((col) => {
			config[col.id] = list.includes(col.id);
		});
		return config;
	}, [filters.visibleColumns]);

	const handleColumnVisibilityChange = (updater: any) => {
		const newVisibility =
			typeof updater === "function" ? updater(initialVisibleColumns) : updater;
		const visibleList = Object.keys(newVisibility).filter(
			(k) => newVisibility[k],
		);
		updateTableState({
			filters: {
				...filters,
				visibleColumns: visibleList.join(","),
			},
		});
	};

	const handleFilterChange = (newFilters: AuditFilters) => {
		const dateRange = newFilters.dateRange;
		updateTableState({
			filters: {
				...filters,
				entityType: newFilters.entityType,
				actionType: newFilters.actionType,
				from: dateRange?.start?.toString(),
				to: dateRange?.end?.toString(),
				actorId: newFilters.actorId,
				entityId: newFilters.entityId,
				projectId: newFilters.projectId,
				environmentId: newFilters.environmentId,
			},
			page: 1,
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
				// Fallback
			}
		}

		return {
			entityType: filters.entityType,
			actionType: filters.actionType,
			dateRange,
			actorId: filters.actorId,
			entityId: filters.entityId,
			projectId: filters.projectId,
			environmentId: filters.environmentId,
		};
	}, [filters]);

	const columns = useMemo(
		() =>
			createAuditLogColumns((log) => {
				setSelectedLog(log);
				setIsDetailOpen(true);
			}),
		[],
	);

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
					<p className="mt-1 text-sm text-default-500">
						View a chronological log of all changes across your organization.
					</p>
				</div>

				<div className="flex items-center gap-3">
					{/* Columns Visibility Popover */}
					<Popover>
						<Button variant="outline" className="gap-2 shrink-0">
							<ColumnsIcon className="size-4" />
							Columns
						</Button>
						<Popover.Content className="w-56">
							<Popover.Dialog>
								<div className="flex flex-col gap-2">
									<h4 className="font-semibold text-sm mb-2 text-foreground border-b pb-1">
										Toggle Columns
									</h4>
									<div className="flex flex-col gap-2.5 max-h-72 overflow-y-auto">
										{ALL_COLUMNS.map((col) => (
											<Checkbox
												key={col.id}
												isSelected={initialVisibleColumns[col.id] ?? false}
												onChange={(isSelected) => {
													const next = {
														...initialVisibleColumns,
														[col.id]: isSelected,
													};
													const visibleList = Object.keys(next).filter(
														(k) => next[k],
													);
													updateTableState({
														filters: {
															...filters,
															visibleColumns: visibleList.join(","),
														},
													});
												}}
												variant="secondary">
												<Checkbox.Content>
													<Checkbox.Control>
														<Checkbox.Indicator />
													</Checkbox.Control>
													{col.label}
												</Checkbox.Content>
											</Checkbox>
										))}
									</div>
								</div>
							</Popover.Dialog>
						</Popover.Content>
					</Popover>
				</div>
			</div>

			<AuditFilter filters={auditFilters} onChange={handleFilterChange} />

			{isError ? (
				<div className="rounded-lg border border-danger-200 bg-danger-50 p-4 text-danger">
					Failed to load audit logs. Please try again.
				</div>
			) : (
				<DataTable
					isLoading={isLoading}
					data={logs}
					columns={columns}
					state={tableState}
					onStateChange={updateTableState}
					pageCount={pageCount}
					rowCount={total}
					emptyMessage="No audit logs found for the selected filters."
					isCompact
					isHeaderSticky
					allowsResizing
					showPageJump
					columnVisibility={initialVisibleColumns}
					onColumnVisibilityChange={handleColumnVisibilityChange}
				/>
			)}

			{/* Audit Log Detail Cover Modal */}
			<AuditLogDetailModal
				isOpen={isDetailOpen}
				onClose={() => setIsDetailOpen(false)}
				log={selectedLog}
			/>
		</div>
	);
}
