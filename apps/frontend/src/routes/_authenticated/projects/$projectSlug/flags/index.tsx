import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@heroui/react";
import { PlusIcon, TrayIcon } from "@phosphor-icons/react";
import {
	useFlags,
	useDeleteFlag,
	useUpdateFlagState,
	type FlagListParams,
} from "@/features/flags/api";
import { FlagModal } from "@/features/flags/FlagModal";
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
		],
	});

	const { data: environments, isPending: isEnvironmentsPending } =
		useEnvironments();
	const params = useMemo(() => toFlagListParams(tableState), [tableState]);
	const { data: flagsResponse, isLoading, isError } = useFlags(params);
	const deleteFlag = useDeleteFlag();
	const updateFlagState = useUpdateFlagState();

	const [modalOpen, setModalOpen] = useState(false);

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

	const hasEnvironments = !!environments && environments.length > 0;
	const isFlagsLoading =
		isEnvironmentsPending || (isLoading && hasEnvironments);

	const flags = flagsResponse?.data ?? [];
	const total = flagsResponse?.total ?? 0;
	const pageCount = Math.ceil(total / tableState.pageSize);

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<div className="flex-1">
					<h1 className="text-2xl font-bold text-foreground">Feature Flags</h1>
					<p className="mt-1 text-sm">
						Manage feature flags for this environment
					</p>
				</div>
				<Button
					variant="primary"
					className="gap-2"
					isDisabled={!hasEnvironments}
					onPress={handleCreate}>
					<PlusIcon className="h-4 w-4" />
					New Flag
				</Button>
			</div>

			{isError ? (
				<div className="rounded-lg border border-danger-200 bg-danger-50 p-4 text-danger">
					Failed to load flags. Please try again.
				</div>
			) : !hasEnvironments ? (
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

			<FlagModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
		</div>
	);
}
