"use client";
import { Card } from "@heroui/react";
import { ChartLineUpIcon, UsersIcon, CheckCircleIcon, XCircleIcon } from "@phosphor-icons/react";
import type { FeatureFlag } from "@/types/feature-flag";
import { DataTable } from "@/components/ui/data-table/DataTable";
import { auditLogColumns } from "@/features/audit/columns";
import { useAuditLogs } from "@/features/audit/api";
import { useDataTableUrlSync } from "@/hooks/useDataTableUrlSync";

interface MonitoringTabProps {
	flag: FeatureFlag;
}

export function MonitoringTab({ flag }: MonitoringTabProps) {
	const { tableState, updateTableState } = useDataTableUrlSync({});
	
	// Pass default sorting in useEffect if needed or let data table handle without defaultSort prop
	const { data, isLoading } = useAuditLogs({
		entityType: "feature_flag", 
		entityId: flag.id,
		limit: tableState.pageSize,
		offset: (tableState.page - 1) * tableState.pageSize,
	});

	return (
		<div className="py-6 max-w-6xl mx-auto space-y-8">
			<div>
				<h2 className="text-lg font-semibold text-foreground">Monitoring</h2>
				<p className="text-sm text-default-500">
					Monitor flag evaluations and audit history.
				</p>
			</div>

			{/* Stats Overview */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<Card className="border border-divider shadow-sm">
					<div className="p-4 flex flex-row items-center gap-4">
						<div className="p-3 bg-primary/10 text-primary rounded-lg">
							<ChartLineUpIcon className="h-6 w-6" />
						</div>
						<div>
							<div className="text-sm text-default-500">Total Evaluations</div>
							<div className="text-2xl font-bold">12,450</div>
						</div>
					</div>
				</Card>
				<Card className="border border-divider shadow-sm">
					<div className="p-4 flex flex-row items-center gap-4">
						<div className="p-3 bg-success/10 text-success rounded-lg">
							<UsersIcon className="h-6 w-6" />
						</div>
						<div>
							<div className="text-sm text-default-500">Unique Users</div>
							<div className="text-2xl font-bold">3,892</div>
						</div>
					</div>
				</Card>
				<Card className="border border-divider shadow-sm">
					<div className="p-4 flex flex-row items-center gap-4">
						<div className="p-3 bg-primary/10 text-primary rounded-lg">
							<CheckCircleIcon className="h-6 w-6" />
						</div>
						<div>
							<div className="text-sm text-default-500">Default Rule Hits</div>
							<div className="text-2xl font-bold">85%</div>
						</div>
					</div>
				</Card>
				<Card className="border border-divider shadow-sm">
					<div className="p-4 flex flex-row items-center gap-4">
						<div className="p-3 bg-danger/10 text-danger rounded-lg">
							<XCircleIcon className="h-6 w-6" />
						</div>
						<div>
							<div className="text-sm text-default-500">Errors</div>
							<div className="text-2xl font-bold">0</div>
						</div>
					</div>
				</Card>
			</div>

			{/* Audit Logs */}
			<div className="space-y-4 pt-4">
				<div>
					<h3 className="text-base font-semibold text-foreground">Audit History</h3>
					<p className="text-sm text-default-500">Recent changes made to this feature flag.</p>
				</div>
				<div className="bg-content1 border border-divider rounded-xl shadow-sm overflow-hidden">
					<DataTable
						columns={auditLogColumns as any}
						data={data?.data ?? []}
						pageCount={Math.ceil((data?.total ?? 0) / tableState.pageSize)}
						state={tableState}
						onStateChange={updateTableState}
						isLoading={isLoading}
					/>
				</div>
			</div>
		</div>
	);
}
