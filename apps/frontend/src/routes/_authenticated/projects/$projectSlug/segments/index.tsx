import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Button, Input, TextField } from "@heroui/react";
import {
	PlusIcon,
	TrashIcon,
	PencilSimpleIcon,
} from "@phosphor-icons/react";
import {
	useProjectSegments,
	useDeleteSegment,
} from "@/features/flags/api";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { DataTable } from "@/components/ui/data-table/DataTable";
import { createColumnHelper } from "@tanstack/react-table";
import { useDataTableUrlSync } from "@/hooks/useDataTableUrlSync";
import { useUIStore } from "@/stores";

const columnHelper = createColumnHelper<any>();

export const Route = createFileRoute(
	"/_authenticated/projects/$projectSlug/segments/",
)({
	component: SegmentsIndex,
});

function SegmentsIndex() {
	const match = Route.useMatch();
	const { projectSlug } = match.params;

	const { data: segments = [], isLoading } = useProjectSegments(true);
	const deleteSegment = useDeleteSegment();

	const { tableState, updateTableState } = useDataTableUrlSync({
		defaultPageSize: 20,
		whitelist: [],
	});

	const [searchQuery, setSearchQuery] = useState("");
	const [deletingSegment, setDeletingSegment] = useState<{
		id: string;
		name: string;
	} | null>(null);
	const { openCreateSegment } = useUIStore();

	const filteredSegments = useMemo(() => {
		return segments.filter(
			(s) =>
				s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				s.key.toLowerCase().includes(searchQuery.toLowerCase()),
		);
	}, [segments, searchQuery]);

	const handleDelete = async () => {
		if (deletingSegment) {
			await deleteSegment.mutateAsync(deletingSegment.id);
			setDeletingSegment(null);
		}
	};

	const columns = useMemo(
		() => [
			columnHelper.accessor("name", {
				header: "Segment Name",
				cell: (info) => (
					<div className="flex flex-col">
					<Link
						to="/projects/$projectSlug/segments/$segmentSlug"
						params={{ projectSlug, segmentSlug: info.row.original.key }}
						className="font-semibold text-foreground hover:underline hover:text-primary transition-colors text-left"
						>
							{info.getValue()}
						</Link>
						<span className="text-xs text-muted-foreground font-mono text-left">
							{info.row.original.key}
						</span>
					</div>
				),
			}),
			columnHelper.accessor("description", {
				header: "Description",
				cell: (info) => (
					<span className="text-sm text-muted-foreground truncate max-w-xs block text-left">
						{info.getValue() || "—"}
					</span>
				),
			}),
			columnHelper.display({
				id: "actions",
				header: "Actions",
				cell: (info) => (
					<div className="flex items-center gap-1 justify-end">
					<Link
						to="/projects/$projectSlug/segments/$segmentSlug"
						params={{ projectSlug, segmentSlug: info.row.original.key }}
						>
							<Button
								isIconOnly
								variant="ghost"
								size="sm"
							>
								<PencilSimpleIcon className="size-4" />
							</Button>
						</Link>
						<Button
							isIconOnly
							variant="ghost"
							size="sm"
							onPress={() => setDeletingSegment(info.row.original)}>
							<TrashIcon className="size-4" />
						</Button>
					</div>
				),
			}),
		],
		[],
	);

	return (
		<div className="space-y-6 p-6">
			<div className="flex justify-between items-center">
				<div className="text-left">
					<h1 className="text-2xl font-bold tracking-tight">Segments</h1>
					<p className="text-sm text-muted-foreground">
						Create rulesets to target group of users across multiple feature
						flags.
					</p>
				</div>
				<Button variant="primary" onPress={openCreateSegment}>
					<PlusIcon className="size-4" weight="bold" />
					Create Segment
				</Button>
			</div>

			<div className="flex items-center gap-4">
				<TextField variant="secondary" className="max-w-xs">
					<Input
						placeholder="Search segments..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</TextField>
			</div>

			<div className="border border-divider rounded-3xl overflow-hidden bg-surface">
				<DataTable
					isLoading={isLoading}
					data={filteredSegments}
					columns={columns}
					state={tableState}
					onStateChange={updateTableState}
				/>
			</div>

			<ConfirmModal
				isOpen={!!deletingSegment}
				onCancel={() => setDeletingSegment(null)}
				onConfirm={handleDelete}
				title="Delete Segment"
				description={`Are you sure you want to delete segment "${deletingSegment?.name}"? Feature flags referencing this segment may fallback to default values.`}
			/>
		</div>
	);
}
