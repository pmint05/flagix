import { createColumnHelper } from "@tanstack/react-table";
import { format } from "date-fns";
import type { AuditLog } from "@/types/audit-log";

const columnHelper = createColumnHelper<AuditLog>();

export const auditLogColumns = [
	columnHelper.accessor("timestamp", {
		header: "Timestamp",
		cell: (info) => (
			<span className="whitespace-nowrap">
				{format(new Date(info.getValue()), "MMM d, yyyy HH:mm:ss")}
			</span>
		),
	}),
	columnHelper.accessor("actorEmail", {
		header: "Actor",
		cell: (info) => {
			const row = info.row.original;
			return (
				<div className="flex flex-col">
					<span className="font-medium">{row.actorEmail ?? "System"}</span>
					<span className="text-xs text-default-400 capitalize">{row.actorType}</span>
				</div>
			);
		},
	}),
	columnHelper.accessor("actionType", {
		header: "Action",
		cell: (info) => <span className="capitalize">{info.getValue()}</span>,
	}),
	columnHelper.accessor("entityType", {
		header: "Entity",
		cell: (info) => {
			const row = info.row.original;
			return (
				<div className="flex flex-col">
					<span className="capitalize">{row.entityType.replace("_", " ")}</span>
					<span className="text-xs text-default-400 font-mono" title={row.entityId}>
						{row.entityId.substring(0, 8)}...
					</span>
				</div>
			);
		},
	}),
	columnHelper.accessor("changes", {
		header: "Details",
		cell: (info) => {
			const changes = info.getValue();
			return (
				<div className="max-w-xs truncate text-sm text-default-500">
					{changes ? JSON.stringify(changes) : "No details"}
				</div>
			);
		},
	}),
];
