import { createFileRoute } from "@tanstack/react-router";
import { Button, Skeleton, SearchField } from "@heroui/react";
import { PlusIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import {
	useFlags,
	useDeleteFlag,
	useUpdateFlagState,
} from "@/features/flags/api";
import { FlagModal } from "@/features/flags/FlagModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { useState, useMemo } from "react";
import { createFlagColumns } from "@/features/flags/columns";
import { DataTable } from "@/components/ui/data-table/DataTable";
import { useDataTableUrlSync } from "@/hooks/useDataTableUrlSync";
import type { ColumnDef } from "@tanstack/react-table";
import type { FeatureFlagListItem } from "@/types/feature-flag";

export const Route = createFileRoute(
	"/_authenticated/projects/$projectSlug/flags/",
)({
	component: FlagsIndex,
});

function FlagsIndex() {
	const match = Route.useMatch();
	const { projectSlug } = match.params;

	const { tableState, updateTableState } = useDataTableUrlSync({
		defaultPageSize: 20,
		whitelist: ["status"],
	});

	const statusFilter = (tableState.filters as { status?: string }).status;
	const { data: flags, isLoading, isError } = useFlags(statusFilter);
	const deleteFlag = useDeleteFlag();
	const updateFlagState = useUpdateFlagState();

	const [modalOpen, setModalOpen] = useState(false);

	const handleCreate = () => {
		setModalOpen(true);
	};

	const columns = useMemo(
		() =>
			createFlagColumns({
				projectSlug,
				onDelete: (flag) => deleteFlag.mutate(flag.id),
				onStatusChange: (flag, status) =>
					updateFlagState.mutate({ flagId: flag.id, status }),
			}) as ColumnDef<FeatureFlagListItem, unknown>[],
		[projectSlug, deleteFlag, updateFlagState],
	);

	const flagList = flags ?? [];

	const statusButtons = [
		{ label: "All", value: undefined },
		{ label: "Draft", value: "draft" },
		{ label: "Active", value: "active" },
		{ label: "Archived", value: "archived" },
	];

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<div className="flex-1">
					<h1 className="text-2xl font-bold text-foreground">Feature Flags</h1>
					<p className="mt-1 text-sm">
						Manage feature flags for this environment
					</p>
				</div>
				<Button variant="primary" className="gap-2" onPress={handleCreate}>
					<PlusIcon className="h-4 w-4" />
					New Flag
				</Button>
			</div>

			<div className="flex items-center gap-2">
				{statusButtons.map(({ label, value }) => (
					<Button
						key={label}
						size="sm"
						variant={statusFilter === value ? "primary" : "ghost"}
						onPress={() => updateTableState({ filters: { status: value }, page: 1 })}>
						{label}
					</Button>
				))}
			</div>

			{isLoading ? (
				<div className="space-y-3">
					{Array.from({ length: 3 }).map((_, i) => (
						<Skeleton key={i} className="h-14 w-full rounded-lg" />
					))}
				</div>
			) : isError ? (
				<div className="rounded-lg border border-danger-200 bg-danger-50 p-4 text-danger">
					Failed to load flags. Please try again.
				</div>
			) : flagList.length === 0 ? (
				<EmptyState
					title="No feature flags yet"
					description="Create your first feature flag to start controlling feature rollouts."
					actionLabel="New Flag"
					onAction={handleCreate}
				/>
			) : (
				<div className="space-y-4">
					<SearchField
						value={tableState.query}
						onChange={(v) => updateTableState({ query: v })}
						variant="secondary"
						aria-label="Search flags"
						className="w-full sm:w-72">
						<SearchField.Group>
							<SearchField.SearchIcon>
								<MagnifyingGlassIcon className="text-muted-foreground" />
							</SearchField.SearchIcon>
							<SearchField.Input placeholder="Search by key or name..." />
							<SearchField.ClearButton />
						</SearchField.Group>
					</SearchField>

					<DataTable
						data={flagList}
						columns={columns}
						state={tableState}
						onStateChange={updateTableState}
						rowCount={flagList.length}
					/>
				</div>
			)}

			<FlagModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
		</div>
	);
}
