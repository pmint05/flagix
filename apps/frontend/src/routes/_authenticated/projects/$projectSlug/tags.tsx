import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Button, Input, TextField } from "@heroui/react";
import { TrashIcon, TagIcon } from "@phosphor-icons/react";
import { useProjectTags, useDeleteTag } from "@/features/flags/api";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataTable } from "@/components/ui/data-table/DataTable";
import { createColumnHelper } from "@tanstack/react-table";
import { useDataTableUrlSync } from "@/hooks/useDataTableUrlSync";

const columnHelper = createColumnHelper<{ id: string; name: string }>();

export const Route = createFileRoute(
	"/_authenticated/projects/$projectSlug/tags",
)({
	component: TagsIndex,
});

function TagsIndex() {
	const { data: tags = [], isLoading } = useProjectTags();
	const deleteTag = useDeleteTag();

	const { tableState, updateTableState } = useDataTableUrlSync({
		defaultPageSize: 20,
		whitelist: [],
	});

	const [searchQuery, setSearchQuery] = useState("");
	const [deletingTag, setDeletingTag] = useState<{
		id: string;
		name: string;
	} | null>(null);

	const filteredTags = useMemo(() => {
		return tags.filter((t) =>
			t.name.toLowerCase().includes(searchQuery.toLowerCase()),
		);
	}, [tags, searchQuery]);

	const handleDelete = async () => {
		if (deletingTag) {
			await deleteTag.mutateAsync(deletingTag.id);
			setDeletingTag(null);
		}
	};

	const columns = useMemo(
		() => [
			columnHelper.accessor("name", {
				header: "Tag Name",
				cell: (info) => (
					<div className="flex items-center gap-2">
						<TagIcon className="size-4 text-muted-foreground" />
						<span className="font-medium">{info.getValue()}</span>
					</div>
				),
			}),
			columnHelper.display({
				id: "actions",
				header: "Actions",
				cell: (info) => (
					<Button
						isIconOnly
						variant="ghost"
						className="hover:bg-danger/10 text-danger transition"
						size="sm"
						onPress={() => setDeletingTag(info.row.original)}>
						<TrashIcon className="size-4" />
					</Button>
				),
			}),
		],
		[],
	);

	return (
		<div className="space-y-6 p-6">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Project Tags</h1>
					<p className="text-sm text-muted-foreground">
						Manage metadata tags used to organize your feature flags.
					</p>
				</div>
			</div>

			<div className="flex items-center gap-4">
				<TextField variant="secondary" className="max-w-xs">
					<Input
						placeholder="Search tags..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</TextField>
			</div>

			<DataTable
				isLoading={isLoading}
				data={filteredTags}
				columns={columns}
				state={tableState}
				onStateChange={updateTableState}
			/>

			<ConfirmModal
				isOpen={!!deletingTag}
				onCancel={() => setDeletingTag(null)}
				onConfirm={handleDelete}
				title="Delete Tag"
				variant="danger"
				description={`Are you sure you want to delete tag "${deletingTag?.name}"? This action cannot be undone.`}
			/>
		</div>
	);
}
