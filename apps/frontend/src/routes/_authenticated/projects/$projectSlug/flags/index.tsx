import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@heroui/react";
import { PlusIcon, TrayIcon } from "@phosphor-icons/react";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import {
	useFlags,
	useDeleteFlag,
	useUpdateFlagState,
	type FlagListParams,
} from "@/features/flags/api";
import {
	FlagFilters,
	type FlagFiltersState,
} from "@/features/flags/FlagFilters";
import { EmptyState } from "@/components/ui/EmptyState";
import { useState, useMemo, useEffect } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { createFlagColumns } from "@/features/flags/columns";
import { DataTable } from "@/components/ui/data-table/DataTable";
import {
	useDataTableUrlSync,
	type TableState,
} from "@/hooks/useDataTableUrlSync";
import type { ColumnDef } from "@tanstack/react-table";
import type { FeatureFlagListItem } from "@/types/feature-flag";
import { useEnvironments } from "@/features/environments/api";

import { PermissionGuard } from "@/components/permission/PermissionGuard";
import { useHasPermission } from "@/hooks/usePermission";
import { useUIStore } from "@/stores";

export const Route = createFileRoute(
	"/_authenticated/projects/$projectSlug/flags/",
)({
	component: FlagsIndex,
});

function toFlagListParams(tableState: TableState): FlagListParams {
	const filters = (tableState.filters ?? {}) as FlagFiltersState;
	const sort =
		tableState.sortBy && tableState.sortDir
			? `${tableState.sortBy}-${tableState.sortDir}`
			: undefined;

	const isTemporaryParam =
		filters.isTemporary && filters.isTemporary.length === 1
			? filters.isTemporary[0] === "true"
			: undefined;

	return {
		q: tableState.query || undefined,
		status: filters.status,
		flagType: filters.flagType,
		visibility: filters.visibility,
		isTemporary: isTemporaryParam,
		creator: filters.creator,
		createdAtFrom: filters.createdAtFrom,
		createdAtTo: filters.createdAtTo,
		tags: filters.tags,
		sort,
		page: tableState.page,
		pageSize: tableState.pageSize,
	};
}

function FlagsIndex() {
	const match = Route.useMatch();
	const { projectSlug } = match.params;
	const navigate = useNavigate();

	const { tableState, updateTableState } = useDataTableUrlSync({
		defaultPageSize: 20,
		whitelist: [
			"status",
			"flagType",
			"visibility",
			"isTemporary",
			"creator",
			"createdAtFrom",
			"createdAtTo",
			"tags",
		],
	});

	const { data: environments, isPending: isEnvironmentsPending } =
		useEnvironments();
	const params = useMemo(() => toFlagListParams(tableState), [tableState]);
	const { data: flagsResponse, isLoading, isError } = useFlags(params);
	const deleteFlag = useDeleteFlag();
	const updateFlagState = useUpdateFlagState();

	const canEditFlag = useHasPermission("flag:edit");
	const canDeleteFlag = useHasPermission("flag:delete");

	const { openCreateFlag } = useUIStore();
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [flagToDelete, setFlagToDelete] = useState<FeatureFlagListItem | null>(
		null,
	);

	const [searchQuery, setSearchQuery] = useState(tableState.query || "");
	const debouncedSearch = useDebounce(searchQuery, 300);

	useEffect(() => {
		if (debouncedSearch !== (tableState.query || "")) {
			updateTableState({ query: debouncedSearch, page: 1 });
		}
	}, [debouncedSearch, tableState.query, updateTableState]);

	useEffect(() => {
		setSearchQuery(tableState.query || "");
	}, [tableState.query]);

	const handleCreate = () => {
		openCreateFlag();
	};

	const columns = useMemo(
		() =>
			createFlagColumns({
				projectSlug,
				onDelete: (flag) => {
					setFlagToDelete(flag);
					setDeleteModalOpen(true);
				},
				onStatusChange: (flag, status) =>
					updateFlagState.mutate({ flagId: flag.id, status }),
				canEdit: canEditFlag,
				canDelete: canDeleteFlag,
			}) as ColumnDef<FeatureFlagListItem, unknown>[],
		[projectSlug, updateFlagState, canEditFlag, canDeleteFlag],
	);

	const hasEnvironments = !!environments && environments.length > 0;
	const isFlagsLoading =
		isEnvironmentsPending || (isLoading && hasEnvironments);

	const flags = flagsResponse?.data ?? [];
	const total = flagsResponse?.total ?? 0;
	const pageCount = Math.ceil(total / tableState.pageSize);

	if (!hasEnvironments && !isEnvironmentsPending)
		return (
			<EmptyState
				icon={<TrayIcon className="size-8 text-muted" weight="duotone" />}
				title="No Environments Found"
				description="You need to create at least one environment before you can create or manage feature flags."
				actionLabel="Go to Environments"
				onAction={() =>
					navigate({
						to: "/projects/$projectSlug/environments",
						params: { projectSlug },
					})
				}
				actionVariant="primary"
			/>
		);

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<div className="flex-1">
					<h1 className="text-2xl font-bold text-foreground">Feature Flags</h1>
					<p className="mt-1 text-sm text-muted">
						Manage feature flags for this environment
					</p>
				</div>
				<PermissionGuard permission="flag:create">
					<Button
						variant="primary"
						className="gap-2"
						isDisabled={!hasEnvironments}
						onPress={handleCreate}>
						<PlusIcon className="h-4 w-4" />
						New Flag
					</Button>
				</PermissionGuard>
			</div>

			{isError ? (
				<div className="rounded-lg border border-danger-200 bg-danger-50 p-4 text-danger">
					Failed to load flags. Please try again.
				</div>
			) : (
				<div className="space-y-4">
					<FlagFilters
						filters={(tableState.filters ?? {}) as FlagFiltersState}
						onChange={(filters) => updateTableState({ filters, page: 1 })}
						searchQuery={searchQuery}
						onSearchChange={(v) => setSearchQuery(v)}
					/>

					<DataTable
						isLoading={isFlagsLoading}
						data={flags}
						columns={columns}
						state={tableState}
						onStateChange={updateTableState}
						pageCount={pageCount}
						rowCount={total}
					/>
				</div>
			)}

			{/* <FlagModal isOpen={isCreateFlagOpen} onClose={closeCreateFlag} /> */}
			{flagToDelete && (
				<ConfirmModal
					showToast
					isOpen={deleteModalOpen}
					onOpenChange={setDeleteModalOpen}
					title="Delete Flag"
					description={`Are you sure you want to delete the flag "${flagToDelete.key}"? This action cannot be undone.`}
					variant="danger"
					requireRetypeContent={flagToDelete.key}
					retypeLabel={`Type "${flagToDelete.key}" to confirm`}
					onConfirm={async () => {
						await deleteFlag.mutateAsync(flagToDelete.id);
						setDeleteModalOpen(false);
						setFlagToDelete(null);
					}}
					onCancel={() => {
						setDeleteModalOpen(false);
						setFlagToDelete(null);
					}}
					confirmText="Delete"
					cancelText="Cancel"
				/>
			)}
		</div>
	);
}
