import { createColumnHelper } from "@tanstack/react-table";
import { Button, Tooltip } from "@heroui/react";
import { Link } from "@tanstack/react-router";
import { PencilSimpleIcon, TrashSimpleIcon } from "@phosphor-icons/react";
import CopyButton from "#/components/ui/copy-button";
import type { Project } from "@/types/project";
import UserAvatar from "@/components/user/user-avatar";
import { formatDistanceToNow } from "date-fns";
import { formatDate } from "@/lib/date";

const columnHelper = createColumnHelper<Project>();

interface ColumnActions {
	onEdit: (project: Project) => void;
	onDelete: (project: Project) => void;
}

export function createProjectColumns(actions: ColumnActions) {
	return [
		columnHelper.accessor("name", {
			header: "Name",
			cell: (info) => {
				const project = info.row.original;
				return (
					<Link
						className="font-medium hover:underline hover:text-accent transition"
						to="/projects/$projectSlug/flags"
						params={{ projectSlug: project.slug }}>
						{project.name}
					</Link>
				);
			},
		}),
		columnHelper.accessor("slug", {
			header: "Slug",
			cell: (info) => {
				const slug = info.getValue();
				return (
					<div className="flex items-center gap-2 group">
						<span>{slug}</span>
						<CopyButton
							text={slug}
							buttonProps={{
								isIconOnly: true,
								className:
									"size-8 group-hover:opacity-100 opacity-0 transition-opacity",
							}}
						/>
					</div>
				);
			},
		}),
		columnHelper.accessor("creator", {
			header: "Creator",
			cell: (info) => {
				const creator = info.getValue();
				return <UserAvatar user={creator || null} showTooltip size="sm" />;
			},
		}),
		columnHelper.accessor("updater", {
			header: "Updater",
			cell: (info) => {
				const updater = info.getValue();
				return <UserAvatar user={updater || null} showTooltip size="sm" />;
			},
		}),
		columnHelper.accessor("createdAt", {
			header: "Created",
			cell: (info) => {
				const date = info.getValue();
				return (
					<Tooltip>
						<Tooltip.Trigger>
							<span className="text-sm text-default-500 cursor-default">
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
							<span className="text-sm text-default-500 cursor-default">
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
				const project = info.row.original;
				return (
					<div className="flex items-center gap-1">
						<Tooltip>
							<Tooltip.Trigger>
								<Button
									isIconOnly
									variant="ghost"
									size="sm"
									onPress={() => actions.onEdit(project)}>
									<PencilSimpleIcon className="h-4 w-4" />
								</Button>
							</Tooltip.Trigger>
							<Tooltip.Content>Edit</Tooltip.Content>
						</Tooltip>
						<Tooltip>
							<Tooltip.Trigger>
								<Button
									isIconOnly
									variant="ghost"
									size="sm"
									className="hover:text-danger hover:bg-danger-soft transition"
									onPress={() => actions.onDelete(project)}>
									<TrashSimpleIcon className="h-4 w-4" />
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
