import { createColumnHelper } from "@tanstack/react-table";
import { Chip, Button, Tooltip } from "@heroui/react";
import { RocketLaunchIcon, TrashIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { FlagToggle } from "./FlagToggle";
import { VariationDots } from "@/components/ui/filters/VariationDots";
import type { FeatureFlagListItem } from "@/types/feature-flag";
import { formatDate } from "#/lib/date";
import UserAvatar from "#/components/user/user-avatar";

const STATUS_CHIP_COLOR: Record<
	string,
	"success" | "warning" | "danger" | "default"
> = {
	draft: "warning",
	active: "success",
	archived: "default",
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
			enableSorting: true,
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
			enableSorting: true,
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
			enableSorting: true,
			header: "Type",
			cell: (info) => {
				const isTemp = info.row.original.isTemporary;
				return (
					<div className="flex items-center gap-1.5">
						<Chip variant="soft">{info.getValue()}</Chip>
						{isTemp && (
							<Chip
								variant="soft"
								color="warning"
								className="text-[10px] h-5 py-0 px-1.5">
								Temp
							</Chip>
						)}
					</div>
				);
			},
		}),
		columnHelper.accessor("status", {
			enableSorting: true,
			header: "Status",
			cell: (info) => {
				const status = info.getValue();
				return (
					<Chip color={STATUS_CHIP_COLOR[status] ?? "default"} variant="soft">
						{status}
					</Chip>
				);
			},
		}),
		columnHelper.accessor("variations", {
			enableSorting: false,
			header: "Variations",
			cell: (info) => <VariationDots variations={info.getValue()} />,
		}),
		columnHelper.accessor("creator", {
			enableSorting: false,
			header: "Created by",
			cell: (info) => {
				const creator = info.getValue();
				if (!creator) return <span className="text-muted-foreground">—</span>;
				return (
					<div className="flex items-center gap-2">
						<UserAvatar
							user={{
								name: creator.name,
								email: creator.email || undefined,
							}}
							showTooltip={creator.email ? true : false}
							className="size-6 rounded-2xl"
							fallbackClassName="text-xs"
						/>
						<span className="text-sm">{creator.name}</span>
					</div>
				);
			},
		}),
		columnHelper.accessor("createdAt", {
			enableSorting: true,
			header: "Created",
			cell: (info) => (
				<span className="text-sm text-muted-foreground">
					{formatDate(info.getValue())}
				</span>
			),
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
										className="hover:text-accent hover:bg-accent-soft-hover transition"
										onPress={() => actions.onStatusChange(flag, "active")}>
										<RocketLaunchIcon className="h-4 w-4" />
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
