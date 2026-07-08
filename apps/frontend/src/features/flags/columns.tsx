import { createColumnHelper } from "@tanstack/react-table";
import { Chip, Button, Tooltip } from "@heroui/react";
import {
	RocketLaunchIcon,
	TrashIcon,
	GlobeSimpleIcon,
	BrowserIcon,
	TerminalIcon,
	type IconProps,
} from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { FlagToggle } from "./FlagToggle";
import { VariationDots } from "@/components/ui/filters/VariationDots";
import type { FeatureFlagListItem } from "@/types/feature-flag";
import { formatDate } from "#/lib/date";
import UserAvatar from "#/components/user/user-avatar";
import CopyButton from "#/components/ui/copy-button";

const STATUS_CHIP_COLOR: Record<
	string,
	"success" | "warning" | "danger" | "default"
> = {
	draft: "warning",
	active: "success",
	archived: "default",
};

const VISIBILITY_META: Record<
	string,
	{ icon: React.ComponentType<IconProps>; label: string }
> = {
	all: { icon: GlobeSimpleIcon, label: "All SDKs" },
	client_only: { icon: BrowserIcon, label: "Client Only" },
	server_only: { icon: TerminalIcon, label: "Server Only" },
};

const columnHelper = createColumnHelper<FeatureFlagListItem>();

interface ColumnActions {
	projectSlug: string;
	onDelete: (flag: FeatureFlagListItem) => void;
	onStatusChange: (
		flag: FeatureFlagListItem,
		status: "draft" | "active" | "archived",
	) => void;
	canEdit: boolean;
	canDelete: boolean;
}

export function createFlagColumns(actions: ColumnActions) {
	return [
		columnHelper.accessor("key", {
			enableSorting: true,
			header: "Key",
			cell: (info) => (
				<div className="flex items-center gap-1 group w-full h-full">
					<Link
						to="/projects/$projectSlug/flags/$flagSlug"
						params={{
							projectSlug: actions.projectSlug,
							flagSlug: info.getValue(),
						}}
						className="text-primary hover:underline">
						<code className="text-sm">{info.getValue()}</code>
					</Link>
					<CopyButton
						text={info.getValue()}
						buttonProps={{
							isIconOnly: true,
							className:
								"group-hover:opacity-100 opacity-0 transition size-6 rounded-xl",
						}}
					/>
				</div>
			),
		}),
		columnHelper.accessor("name", {
			enableSorting: true,
			header: "Name",
			cell: (info) => {
				const tags = info.row.original.tags ?? [];
				return (
					<div className="flex flex-col gap-1">
						<Link
							to="/projects/$projectSlug/flags/$flagSlug"
							params={{
								projectSlug: actions.projectSlug,
								flagSlug: info.row.original.key,
							}}
							className="font-medium text-foreground hover:text-primary transition-colors">
							{info.getValue()}
						</Link>
						{tags.length > 0 && (
							<div className="flex flex-wrap gap-1">
								{tags.map((tag) => (
									<Chip key={tag} variant="soft" size="sm">
										{tag}
									</Chip>
								))}
							</div>
						)}
					</div>
				);
			},
		}),
		columnHelper.accessor("flagType", {
			enableSorting: true,
			header: "Type",
			cell: (info) => {
				const isTemp = info.row.original.isTemporary;
				const visibility = info.row.original.visibility;
				const visMeta = VISIBILITY_META[visibility];
				const VisIcon = visMeta?.icon;
				return (
					<div className="flex items-center gap-1.5">
						{VisIcon && (
							<Tooltip>
								<Tooltip.Trigger>
									<Chip
										variant="soft"
										className="p-1 rounded-xl size-6 relative top-0.5">
										<VisIcon className="size-5" weight="bold" />
									</Chip>
								</Tooltip.Trigger>
								<Tooltip.Content>{visMeta.label}</Tooltip.Content>
							</Tooltip>
						)}
						<Chip variant="soft">{info.getValue()}</Chip>
						{isTemp && (
							<Chip variant="soft" color="warning">
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
					<UserAvatar
						user={{
							name: creator.name,
							email: creator.email || undefined,
						}}
						showTooltip={creator.email ? true : false}
						className="size-6 rounded-2xl"
						fallbackClassName="text-xs"
					/>
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
						{flag.status === "draft" && actions.canEdit && (
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
						{actions.canDelete && (
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
						)}
					</div>
				);
			},
		}),
	];
}
