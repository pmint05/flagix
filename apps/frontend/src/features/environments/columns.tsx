import { createColumnHelper } from "@tanstack/react-table";
import { Button, Chip, Tooltip } from "@heroui/react";
import { PencilSimpleIcon, TrashSimpleIcon } from "@phosphor-icons/react";
import { AsyncSwitch } from "@/components/ui/async-switch";
import CopyButton from "#/components/ui/copy-button";
import { generateColorFromString } from "#/lib/color-from-string";
import { formatDistanceToNow } from "date-fns";
import { formatDate } from "#/lib/date";
import type { Environment } from "@/types/environment";

const TYPE_BADGE_COLOR: Record<string, "success" | "warning" | "accent" | "default"> = {
	development: "accent",
	staging: "warning",
	production: "success",
	custom: "default",
};

const columnHelper = createColumnHelper<Environment>();

interface ColumnActions {
	onEdit: (env: Environment) => void;
	onDelete: (env: Environment) => void;
	onToggleActive: (env: Environment) => Promise<void>;
}

export function createEnvironmentColumns(actions: ColumnActions) {
	return [
		columnHelper.accessor("name", {
			header: "Name",
			cell: (info) => {
				const env = info.row.original;
				return (
					<div className="flex items-center gap-2">
						<div
							className="size-3 rounded-full"
							style={{ backgroundColor: generateColorFromString(env.name) }}
						/>
						<span className="font-medium text-foreground">{env.name}</span>
					</div>
				);
			},
		}),
		columnHelper.accessor("slug", {
			header: "Slug",
			cell: (info) => {
				const slug = info.getValue();
				return (
					<div className="flex items-center gap-2 group">
						<span className="text-muted-foreground">{slug}</span>
						<CopyButton
							text={slug}
							buttonProps={{
								className: "size-8 group-hover:opacity-100 opacity-0 transition-opacity",
							}}
						/>
					</div>
				);
			},
		}),
		columnHelper.accessor("type", {
			header: "Type",
			cell: (info) => {
				const type = info.getValue();
				return (
					<Chip color={TYPE_BADGE_COLOR[type] ?? "default"} variant="soft">
						{type}
					</Chip>
				);
			},
		}),
		columnHelper.accessor("description", {
			header: "Description",
			cell: (info) => {
				const desc = info.getValue();
				return (
					<Tooltip>
						<Tooltip.Trigger className="min-w-0 truncate block">
							<span className="truncate min-w-0 block text-muted-foreground">
								{desc || "--"}
							</span>
						</Tooltip.Trigger>
						<Tooltip.Content>
							<pre>{desc || "No description"}</pre>
						</Tooltip.Content>
					</Tooltip>
				);
			},
		}),
		columnHelper.accessor("isActive", {
			header: "Active",
			cell: (info) => {
				const env = info.row.original;
				return (
					<AsyncSwitch
						isSelected={env.isActive}
						action={() => actions.onToggleActive(env)}
						size="sm"
						showToast
						actionName="Toggle Status"
						message={`Environment ${env.name} is now ${!env.isActive ? "active" : "inactive"}`}
					/>
				);
			},
		}),
		columnHelper.accessor("createdAt", {
			header: "Created",
			cell: (info) => {
				const date = info.getValue();
				return (
					<Tooltip>
						<Tooltip.Trigger>
							<span className="text-muted-foreground">
								{formatDistanceToNow(new Date(date), { addSuffix: true })}
							</span>
						</Tooltip.Trigger>
						<Tooltip.Content>{formatDate(date)}</Tooltip.Content>
					</Tooltip>
				);
			},
		}),
		columnHelper.accessor("updatedAt", {
			header: "Updated",
			cell: (info) => {
				const date = info.getValue();
				return (
					<Tooltip>
						<Tooltip.Trigger>
							<span className="text-muted-foreground">
								{formatDistanceToNow(new Date(date), { addSuffix: true })}
							</span>
						</Tooltip.Trigger>
						<Tooltip.Content>{formatDate(date)}</Tooltip.Content>
					</Tooltip>
				);
			},
		}),
		columnHelper.display({
			id: "actions",
			header: "Actions",
			cell: (info) => {
				const env = info.row.original;
				return (
					<div className="flex items-center gap-1">
						<Tooltip>
							<Tooltip.Trigger>
								<Button
									isIconOnly
									variant="ghost"
									size="sm"
									onPress={() => actions.onEdit(env)}>
									<PencilSimpleIcon className="size-4" />
								</Button>
							</Tooltip.Trigger>
							<Tooltip.Content>Edit</Tooltip.Content>
						</Tooltip>
						<Tooltip>
							<Tooltip.Trigger>
								<Button
									isIconOnly
									variant="ghost"
									className="hover:text-danger hover:bg-danger-soft"
									size="sm"
									onPress={() => actions.onDelete(env)}>
									<TrashSimpleIcon className="size-4" />
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
