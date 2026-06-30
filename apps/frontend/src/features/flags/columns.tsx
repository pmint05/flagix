import { createColumnHelper } from "@tanstack/react-table";
import { Chip, Button, Tooltip } from "@heroui/react";
import { TrashIcon, WarningIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { FlagToggle } from "./FlagToggle";
import type { FeatureFlagListItem } from "@/types/feature-flag";

const STATUS_Chip_COLOR: Record<
	string,
	"success" | "warning" | "danger" | "default"
> = {
	draft: "default",
	active: "success",
	archived: "danger",
};

const columnHelper = createColumnHelper<FeatureFlagListItem>();

interface ColumnActions {
	projectSlug: string;
	onDelete: (flag: FeatureFlagListItem) => void;
	onStatusChange: (
		flag: FeatureFlagListItem,
		status: "draft" | "active" | "archived",
	) => void;
}

export function createFlagColumns(actions: ColumnActions) {
	return [
		columnHelper.accessor("key", {
			header: "Key",
			cell: (info) => (
				<Link
					to="/projects/$projectSlug/flags/$flagSlug"
					params={{
						projectSlug: actions.projectSlug,
						flagSlug: info.getValue(),
					}}
					className="text-primary hover:underline">
					<code className="text-sm">{info.getValue()}</code>
				</Link>
			),
		}),
		columnHelper.accessor("name", {
			header: "Name",
			cell: (info) => (
				<Link
					to="/projects/$projectSlug/flags/$flagSlug"
					params={{
						projectSlug: actions.projectSlug,
						flagSlug: info.row.original.key,
					}}
					className="font-medium text-foreground hover:text-primary transition-colors">
					{info.getValue()}
				</Link>
			),
		}),
		columnHelper.accessor("flagType", {
			header: "Type",
			cell: (info) => <Chip variant="soft">{info.getValue()}</Chip>,
		}),
		columnHelper.accessor("status", {
			header: "Status",
			cell: (info) => {
				const status = info.getValue();
				return (
					<Chip color={STATUS_Chip_COLOR[status] ?? "default"} variant="soft">
						{status}
					</Chip>
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
