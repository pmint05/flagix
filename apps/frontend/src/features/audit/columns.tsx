import { createColumnHelper } from "@tanstack/react-table";
import { format } from "date-fns";
import { maskEmail } from "@/lib/masking";
import type { AuditLog } from "@/types/audit-log";
import { Chip, Button } from "@heroui/react";
import CopyButton from "@/components/ui/copy-button";
import diff from "microdiff";
import { EyeIcon } from "@phosphor-icons/react";
import UserAvatar from "#/components/user/user-avatar";
import { formatDate } from "#/lib/date";

const columnHelper = createColumnHelper<AuditLog>();

export function getActionStyle(action: string) {
	const parts = action.split("_");
	const suffix = parts[parts.length - 1];

	let color:
		| "success"
		| "warning"
		| "danger"
		| "accent"
		| "secondary"
		| "default" = "default";

	switch (suffix) {
		case "CREATE":
		case "INVITE":
		case "ADD":
		case "ACTIVATE":
		case "ENABLE":
			color = "success";
			break;
		case "UPDATE":
		case "TOGGLE":
		case "ROTATE":
		case "REORDER":
			color = "accent";
			break;
		case "DELETE":
		case "REMOVE":
		case "REVOKE":
			color = "danger";
			break;
		case "ARCHIVE":
		case "DISABLE":
			color = "warning";
			break;
		default:
			color = "accent";
			break;
	}

	return { suffix, color };
}

const IGNORED_KEYS = [
	"id",
	"createdAt",
	"updatedAt",
	"createdBy",
	"updatedBy",
	"version",
	"rawKey",
	"keyHash",
	"lastUsedAt",
];

export function sanitizeDiffObject(obj: any): any {
	if (!obj || typeof obj !== "object") return obj;

	if (Array.isArray(obj)) {
		return obj.map(sanitizeDiffObject).filter(Boolean);
	}

	const res: Record<string, any> = {};
	let hasKeys = false;
	for (const [key, val] of Object.entries(obj)) {
		if (IGNORED_KEYS.includes(key)) continue;
		res[key] = sanitizeDiffObject(val);
		hasKeys = true;
	}
	return hasKeys ? res : null;
}

export function formatFirstChange(before: any, after: any) {
	const cleanBefore = sanitizeDiffObject(before);
	const cleanAfter = sanitizeDiffObject(after);

	if (!cleanBefore && !cleanAfter) return "No details";

	if (!cleanBefore && cleanAfter) {
		const keys = Object.keys(cleanAfter);
		if (keys.length === 0) return "Created empty entity";
		return `Created with properties: ${keys.slice(0, 3).join(", ")}${keys.length > 3 ? "..." : ""}`;
	}

	if (cleanBefore && !cleanAfter) {
		return "Deleted entity";
	}

	try {
		const differences = diff(cleanBefore, cleanAfter);
		if (differences.length === 0) return "No changes";

		const formatVal = (val: any) => {
			if (val === null || val === undefined) return "null";
			if (typeof val === "object") return JSON.stringify(val);
			return String(val);
		};

		const first = differences[0];
		const pathStr = first.path.join(".");

		let summary = "";
		if (first.type === "CHANGE") {
			summary = `Updated "${pathStr}": ${formatVal(first.oldValue)} to ${formatVal(first.value)}`;
		} else if (first.type === "CREATE") {
			summary = `Added "${pathStr}": ${formatVal(first.value)}`;
		} else if (first.type === "REMOVE") {
			summary = `Removed "${pathStr}"`;
		}

		return {
			summary,
			totalChanges: differences.length,
		};
	} catch (e) {
		return "Failed to parse changes";
	}
}

export const createAuditLogColumns = (
	onViewDetail: (log: AuditLog) => void,
) => [
	columnHelper.accessor("timestamp", {
		id: "timestamp",
		header: "Timestamp",
		enableSorting: true,
		cell: (info) => (
			<span className="whitespace-nowrap">{formatDate(info.getValue())}</span>
		),
	}),
	columnHelper.accessor("actorEmail", {
		id: "actor",
		header: "Actor",
		enableSorting: false,
		cell: (info) => {
			const row = info.row.original;
			return (
				<div className="flex items-center gap-2">
					<UserAvatar
						user={{
							name: row.actorName || row.actorEmail || "System",
							email: row.actorEmail || "",
						}}
						size="sm"
						className="size-6"
						showTooltip
					/>
					{/* <div className="flex flex-col min-w-30">
						<span className="font-medium text-sm">
							{row.actorName || (row.actorEmail ? row.actorEmail : "System")}
						</span>
						{row.actorEmail && (
							<span className="text-xs font-mono">{row.actorEmail}</span>
						)}
					</div> */}
				</div>
			);
		},
	}),
	columnHelper.accessor("actionType", {
		id: "action",
		header: "Action",
		enableSorting: true,
		cell: (info) => {
			const action = info.getValue();
			const { suffix, color } = getActionStyle(action);
			return (
				<Chip color={color} variant="secondary">
					{/* {suffix} */}
					{action}
				</Chip>
			);
		},
	}),
	columnHelper.accessor("projectName", {
		id: "project",
		header: "Project",
		enableSorting: false,
		cell: (info) => {
			const val = info.getValue();
			return (
				<span className="whitespace-nowrap font-medium">{val || "—"}</span>
			);
		},
	}),
	columnHelper.accessor("environmentName", {
		id: "environment",
		header: "Environment",
		enableSorting: false,
		cell: (info) => {
			const val = info.getValue();
			return (
				<span className="whitespace-nowrap font-medium">{val || "—"}</span>
			);
		},
	}),
	columnHelper.accessor("entityType", {
		id: "entityType",
		header: "Entity Type",
		enableSorting: true,
		cell: (info) => (
			<Chip variant="soft" className="uppercase">
				{info.getValue().replace("_", " ")}
			</Chip>
		),
	}),
	columnHelper.accessor("entityId", {
		id: "entity",
		header: "Entity",
		enableSorting: false,
		cell: (info) => {
			const row = info.row.original;
			let displayName = "—";

			if (row.entityType === "feature_flag") {
				displayName = row.flagKey || row.flagName || "Flag";
			} else if (row.entityType === "project") {
				displayName = row.projectName || "Project";
			} else if (row.entityType === "environment") {
				displayName = row.environmentName || "Environment";
			} else if (row.entityType === "organization") {
				displayName = row.projectName || "Organization";
			} else if (row.entityType === "targeting_rule") {
				displayName = row.flagKey ? `Rule of ${row.flagKey}` : "Targeting Rule";
			} else if (row.entityType === "variation") {
				displayName = row.flagKey ? `Variation of ${row.flagKey}` : "Variation";
			}

			return (
				<div className="flex flex-col min-w-30">
					<span className="font-medium text-sm text-foreground">
						{displayName}
					</span>
					{/* <span className="text-xs capitalize">
						{row.entityType.replace("_", " ")}
					</span> */}
				</div>
			);
		},
	}),
	columnHelper.accessor("entityId", {
		id: "entityId",
		header: "Entity ID",
		enableSorting: false,
		cell: (info) => {
			const val = info.getValue();
			return (
				<div className="flex items-center gap-1.5 font-mono text-xs">
					<span title={val} className="truncate max-w-25">
						{val}
					</span>
					<CopyButton
						text={val}
						buttonProps={{
							size: "sm",
							isIconOnly: true,
							variant: "ghost",
							className:
								"p-1 h-auto min-w-0 flex rounded-xl items-center justify-center size-7",
						}}
					/>
				</div>
			);
		},
	}),
	columnHelper.accessor("changes", {
		id: "changes",
		header: "Changes",
		enableSorting: false,
		cell: (info) => {
			const changes = info.getValue() as { before: any; after: any } | null;
			if (!changes) return <span className="text-xs">No details</span>;

			const diffResult = formatFirstChange(changes.before, changes.after);

			if (typeof diffResult === "string") {
				return <span className="text-xs">{diffResult}</span>;
			}

			return (
				<div className="flex flex-col gap-1">
					<span
						className="text-xs font-mono truncate max-w-200"
						title={diffResult.summary}>
						{diffResult.summary}
					</span>
					{diffResult.totalChanges > 1 && (
						<Chip
							size="sm"
							color="default"
							variant="soft"
							className="font-medium w-fit">
							+{diffResult.totalChanges - 1} more changes
						</Chip>
					)}
				</div>
			);
		},
	}),
	columnHelper.accessor("actorIp", {
		id: "actorIp",
		header: "IP Address",
		enableSorting: false,
		cell: (info) => (
			<span className="text-xs font-mono">{info.getValue() || "—"}</span>
		),
	}),
	columnHelper.accessor("userAgent", {
		id: "userAgent",
		header: "User Agent",
		enableSorting: false,
		cell: (info) => (
			<span
				className="text-xs truncate max-w-37.5 block"
				title={info.getValue() || ""}>
				{info.getValue() || "—"}
			</span>
		),
	}),
	columnHelper.accessor("source", {
		id: "source",
		header: "Source",
		enableSorting: false,
		cell: (info) => {
			const src = info.getValue();
			if (!src) return <span className="text-xs">—</span>;
			return (
				<Chip size="sm" variant="soft" className="capitalize text-xs">
					{src}
				</Chip>
			);
		},
	}),
	columnHelper.accessor("requestMethod", {
		id: "requestMethod",
		header: "Method",
		enableSorting: false,
		cell: (info) => {
			const method = info.getValue();
			if (!method) return <span className="text-xs">—</span>;
			let color: "accent" | "success" | "warning" | "danger" | "default" =
				"default";
			if (method === "GET") color = "accent";
			else if (method === "POST") color = "success";
			else if (method === "PATCH" || method === "PUT") color = "warning";
			else if (method === "DELETE") color = "danger";

			return (
				<Chip
					size="sm"
					color={color}
					variant="soft"
					className="text-xs font-mono font-bold">
					{method}
				</Chip>
			);
		},
	}),
	columnHelper.accessor("requestPath", {
		id: "requestPath",
		header: "Path",
		enableSorting: false,
		cell: (info) => (
			<span
				className="text-xs font-mono truncate block"
				title={info.getValue() || ""}>
				{info.getValue() || "—"}
			</span>
		),
	}),
	columnHelper.display({
		id: "actions",
		header: "Actions",
		maxSize: 100,
		cell: (info) => {
			const row = info.row.original;
			return (
				<Button
					size="sm"
					variant="outline"
					className="gap-1 px-2.5"
					onPress={() => onViewDetail(row)}>
					<EyeIcon className="size-4" />
					View
				</Button>
			);
		},
	}),
];
