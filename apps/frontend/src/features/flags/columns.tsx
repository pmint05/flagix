import { createColumnHelper } from "@tanstack/react-table";
import { Badge, Button, Tooltip } from "@heroui/react";
import { TrashIcon, WarningIcon } from "@phosphor-icons/react";
import { FlagToggle } from "./FlagToggle";
import type { FeatureFlagListItem } from "@/types/feature-flag";

const STATUS_BADGE_COLOR: Record<string, "success" | "warning" | "danger" | "default"> = {
	draft: "default",
	active: "success",
	archived: "danger",
};

const columnHelper = createColumnHelper<FeatureFlagListItem>();

interface ColumnActions {
	onDelete: (flag: FeatureFlagListItem) => void;
	onStatusChange: (flag: FeatureFlagListItem, status: "draft" | "active" | "archived") => void;
}

export function createFlagColumns(actions: ColumnActions) {
	return [
		columnHelper.accessor("key", {
			header: "Key",
			cell: (info) => <code className="text-sm">{info.getValue()}</code>,
		}),
		columnHelper.accessor("name", {
			header: "Name",
			cell: (info) => (
				<span className="font-medium text-foreground">{info.getValue()}</span>
			),
		}),
		columnHelper.accessor("flagType", {
			header: "Type",
			cell: (info) => <Badge variant="soft">{info.getValue()}</Badge>,
		}),
		columnHelper.accessor("status", {
			header: "Status",
			cell: (info) => {
				const status = info.getValue();
				return (
					<Badge color={STATUS_BADGE_COLOR[status] ?? "default"} variant="soft">
						{status}
					</Badge>
				);
			},
		}),
		columnHelper.display({
			id: "enabled",
			header: "Enabled",
			cell: (info) => {
				const flag = info.row.original;
				return <FlagToggle flagId={flag.id} isEnabled={flag.isEnabled} />;
			},
		}),
		columnHelper.display({
			id: "actions",
			header: "Actions",
			cell: (info) => {
				const flag = info.row.original;
				return (
					<div className="flex items-center gap-1">
						{flag.status === "draft" && (
							<Tooltip>
								<Tooltip.Trigger>
									<Button
										isIconOnly
										variant="ghost"
										size="sm"
										onPress={() => actions.onStatusChange(flag, "active")}>
										<WarningIcon className="h-4 w-4" />
									</Button>
								</Tooltip.Trigger>
								<Tooltip.Content>Activate</Tooltip.Content>
							</Tooltip>
						)}
						<Tooltip>
							<Tooltip.Trigger>
								<Button
									isIconOnly
									variant="ghost"
									size="sm"
									className="text-danger"
									onPress={() => actions.onDelete(flag)}>
									<TrashIcon className="h-4 w-4" />
								</Button>
							</Tooltip.Trigger>
							<Tooltip.Content>Delete</Tooltip.Content>
						</Tooltip>
					</div>
				);
			},
		}),
	];
}
