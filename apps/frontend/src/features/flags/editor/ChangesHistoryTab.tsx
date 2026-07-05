"use client";
import type { FeatureFlag } from "@/types/feature-flag";
import { DataTable } from "@/components/ui/data-table/DataTable";
import { createAuditLogColumns } from "@/features/audit/columns";
import { AuditLogDetailModal } from "@/features/audit/AuditLogDetailModal";
import { useAuditLogs } from "@/features/audit/api";
import { useDataTableUrlSync } from "@/hooks/useDataTableUrlSync";
import { useMemo, useState } from "react";
import type { AuditLog } from "@/types/audit-log";
import { ClockCounterClockwiseIcon } from "@phosphor-icons/react";
import { useContextStore } from "@/stores";

interface MonitoringTabProps {
	flag: FeatureFlag;
}

const columnVisibility = {
	timestamp: true,
	actor: true,
	action: true,
	project: false,
	environment: true,
	entityType: false,
	entity: false,
	entityId: true,
	changes: true,
	actorIp: false,
	userAgent: false,
	source: false,
	requestMethod: false,
	requestPath: false,
};

export function MonitoringTab({ flag }: MonitoringTabProps) {
	const { tableState, updateTableState } = useDataTableUrlSync({});
	const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
	const [isDetailOpen, setIsDetailOpen] = useState(false);
	const currentEnv = useContextStore((s) => s.selectedEnvironment);

	const columns = useMemo(
		() =>
			createAuditLogColumns((log) => {
				setSelectedLog(log);
				setIsDetailOpen(true);
			}),
		[],
	);

	const { data, isLoading } = useAuditLogs({
		projectId: flag.projectId,
		environmentId: currentEnv?.id,
		entityType: "feature_flag",
		entityId: flag.id,
		limit: tableState.pageSize,
		offset: (tableState.page - 1) * tableState.pageSize,
	});

	return (
		<div className="py-6 space-y-4">
			<div className="flex items-center gap-2">
				<ClockCounterClockwiseIcon className="text-muted" />
				<h3>Recent changes made to this flag.</h3>
			</div>

			<DataTable
				columns={columns as any}
				data={data?.data ?? []}
				pageCount={Math.ceil((data?.total ?? 0) / tableState.pageSize)}
				state={tableState}
				onStateChange={updateTableState}
				isLoading={isLoading}
				columnVisibility={columnVisibility}
				isCompact
				
			/>

			<AuditLogDetailModal
				isOpen={isDetailOpen}
				onClose={() => setIsDetailOpen(false)}
				log={selectedLog}
			/>
		</div>
	);
}
