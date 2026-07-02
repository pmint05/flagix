import { createFileRoute } from "@tanstack/react-router";
import {
	Button,
	Select,
	ListBox,
	SearchField,
	Popover,
	TagGroup,
	Tag,
} from "@heroui/react";
import {
	PlusIcon,
	MagnifyingGlassIcon,
	FadersIcon,
	XIcon,
} from "@phosphor-icons/react";
import {
	useEnvironments,
	useToggleEnvironmentActive,
	useDeleteEnvironment,
} from "@/features/environments/api";
import {
	ENV_TYPE_FILTER_OPTIONS,
	ENV_STATUS_OPTIONS,
} from "@/features/environments/constants";
import { EnvironmentModal } from "@/features/environments/EnvironmentModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { ActionButton } from "@/components/ui/action-button";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { useState, useEffect, useMemo } from "react";
import { useContextStore } from "@/stores";
import type { Environment } from "@/types/environment";
import { createEnvironmentColumns } from "@/features/environments/columns";
import { DataTable } from "@/components/ui/data-table/DataTable";
import { useDataTableUrlSync } from "@/hooks/useDataTableUrlSync";
import { TrayIcon } from "@phosphor-icons/react";
import { EmptyState as HeroUIEmptyState } from "@heroui/react";
import type { ColumnDef } from "@tanstack/react-table";

export const Route = createFileRoute(
	"/_authenticated/projects/$projectSlug/environments",
)({
	component: EnvironmentsIndex,
});

function EnvironmentsIndex() {
	const { data: environments, isLoading, isError } = useEnvironments();
	const toggleActive = useToggleEnvironmentActive();
	const deleteEnvironment = useDeleteEnvironment();
	const { selectedEnvironment, setEnvironment } = useContextStore();

	const [modalOpen, setModalOpen] = useState(false);
	const [batchDeleteModalOpen, setBatchDeleteModalOpen] = useState(false);
	const [editingEnv, setEditingEnv] = useState<Environment | undefined>();
	const [deletingEnv, setDeletingEnv] = useState<Environment | undefined>();

	const [selectedIds, setSelectedIds] = useState<string[]>([]);

	const { tableState, updateTableState } = useDataTableUrlSync({
		defaultPageSize: 20,
		whitelist: ["type", "active"],
	});

	const envFilters = tableState.filters as {
		type?: string;
		active?: string;
	};
	const typeFilter = envFilters.type ?? "all";
	const activeFilter = envFilters.active ?? "all";

	useEffect(() => {
		if (
			!isLoading &&
			environments &&
			environments.length > 0 &&
			!selectedEnvironment
		) {
			setEnvironment(environments[0]);
		}
	}, [isLoading, environments, selectedEnvironment, setEnvironment]);

	const handleCreate = () => {
		setEditingEnv(undefined);
		setModalOpen(true);
	};

	const handleEdit = (env: Environment) => {
		setEditingEnv(env);
		setModalOpen(true);
	};

	const handleToggleActive = async (env: Environment) => {
		await toggleActive.mutateAsync({
			id: env.id,
			isActive: !env.isActive,
		});
	};

	const handleDelete = async () => {
		if (!deletingEnv) return;
		await deleteEnvironment.mutateAsync(deletingEnv.id);
		setDeletingEnv(undefined);
	};

	const envs = environments ?? [];

	const filteredEnvs = useMemo(() => {
		return envs.filter((env) => {
			const matchesType = typeFilter === "all" || env.type === typeFilter;
			const matchesActive =
				activeFilter === "all" ||
				(activeFilter === "active" ? env.isActive : !env.isActive);
			return matchesType && matchesActive;
		});
	}, [envs, typeFilter, activeFilter]);

	const columns = useMemo(
		() =>
			createEnvironmentColumns({
				onEdit: handleEdit,
				onDelete: (env) => setDeletingEnv(env),
				onToggleActive: handleToggleActive,
			}) as ColumnDef<Environment, unknown>[],
		[],
	);

	const activeTags = useMemo(() => {
		const tags: Array<{ key: string; label: string }> = [];
		if (envFilters.type && envFilters.type !== "all") {
			const opt = ENV_TYPE_FILTER_OPTIONS.find(
				(o) => o.key === envFilters.type,
			);
			tags.push({
				key: "type",
				label: `Type: ${opt?.label ?? envFilters.type}`,
			});
		}
		if (envFilters.active && envFilters.active !== "all") {
			const opt = ENV_STATUS_OPTIONS.find((o) => o.key === envFilters.active);
			tags.push({
				key: "active",
				label: `Status: ${opt?.label ?? envFilters.active}`,
			});
		}
		return tags;
	}, [envFilters]);

	const handleRemoveTag = (key: string) => {
		updateTableState({
			filters: {
				...tableState.filters,
				[key]: undefined,
			},
		});
	};

	const handleClearAll = () => {
		updateTableState({
			filters: {},
		});
	};

	const handleBatchDelete = async () => {
		if (selectedIds.length === 0) return;
		await Promise.all(
			selectedIds.map((id) => deleteEnvironment.mutateAsync(id)),
		);
		setSelectedIds([]);
	};

	const handleBatchToggleActive = async (active: boolean) => {
		const mutations = selectedIds.map((id) => {
			const env = filteredEnvs.find((e) => e.id === id);
			if (env && env.isActive !== active) {
				return toggleActive.mutateAsync({ id, isActive: active });
			}
			return Promise.resolve();
		});
		await Promise.all(mutations);
		setSelectedIds([]);
	};

	const emptyStateContent = (
		<HeroUIEmptyState className="flex h-full w-full flex-col items-center justify-center gap-4 text-center min-h-50">
			<TrayIcon className="size-8 text-muted" weight="duotone" />
			<span className="text-muted">
				No results matching the current filters.
			</span>
		</HeroUIEmptyState>
	);

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<div className="flex-1">
					<h1 className="text-2xl font-bold text-foreground">Environments</h1>
					<p className="mt-1 text-sm">
						Manage deployment environments for this project
					</p>
				</div>
				{selectedIds.length > 0 && (
					<div className="flex items-center gap-2 mr-2">
						<span className="text-sm text-muted-foreground mr-2">
							{selectedIds.length} selected
						</span>
						<ActionButton
							variant="secondary"
							size="sm"
							action={() => handleBatchToggleActive(true)}
							showToast
							toastTitle="Updated"
							toastMessage="Environments set to active">
							Set Active
						</ActionButton>
						<ActionButton
							variant="secondary"
							size="sm"
							action={() => handleBatchToggleActive(false)}
							showToast
							toastTitle="Updated"
							toastMessage="Environments set to inactive">
							Set Inactive
						</ActionButton>
						<Button
							variant="danger"
							size="sm"
							onPress={() => setBatchDeleteModalOpen(true)}>
							Delete
						</Button>
					</div>
				)}
				<Button variant="primary" className="gap-2" onPress={handleCreate}>
					<PlusIcon className="h-4 w-4" />
					New Environment
				</Button>
			</div>

			{isError ? (
				<div className="rounded-lg border border-danger-200 bg-danger-50 p-4 text-danger">
					Failed to load environments. Please try again.
				</div>
			) : (
				<div className="space-y-4">
					<div className="flex flex-col sm:flex-row gap-2 items-center">
						<SearchField
							value={tableState.query}
							onChange={(v) => updateTableState({ query: v })}
							variant="secondary"
							aria-label="Search environments"
							className="w-full sm:w-72">
							<SearchField.Group>
								<SearchField.SearchIcon>
									<MagnifyingGlassIcon className="text-muted-foreground" />
								</SearchField.SearchIcon>
								<SearchField.Input placeholder="Search environments..." />
								<SearchField.ClearButton />
							</SearchField.Group>
						</SearchField>
						<div className="flex items-center gap-3 w-full sm:w-auto">
							<Popover>
								<Popover.Trigger>
									<Button variant="secondary" className="gap-2">
										<FadersIcon className="size-4" />
										Filters
									</Button>
								</Popover.Trigger>
								<Popover.Content className="w-64" placement="bottom end">
									<Popover.Dialog className="p-3 space-y-4">
										<div className="text-xs font-semibold text-foreground/80 border-b border-divider pb-1.5">
											Filter Environments
										</div>
										<div className="flex flex-col gap-3">
											<div className="flex flex-col gap-1.5">
												<span className="text-xs font-medium text-muted-foreground">
													Type
												</span>
												<Select
													value={typeFilter}
													onChange={(key) =>
														updateTableState({
															filters: {
																...tableState.filters,
																type:
																	key?.toString() === "all"
																		? undefined
																		: key?.toString(),
															},
														})
													}
													aria-label="Filter by type"
													className="w-full"
													variant="secondary">
													<Select.Trigger>
														<Select.Value />
														<Select.Indicator />
													</Select.Trigger>
													<Select.Popover>
														<ListBox>
															{ENV_TYPE_FILTER_OPTIONS.map((option) => (
																<ListBox.Item
																	id={option.key}
																	key={option.key}
																	textValue={option.label}>
																	{option.label}
																	<ListBox.ItemIndicator />
																</ListBox.Item>
															))}
														</ListBox>
													</Select.Popover>
												</Select>
											</div>

											<div className="flex flex-col gap-1.5">
												<span className="text-xs font-medium text-muted-foreground">
													Status
												</span>
												<Select
													value={activeFilter}
													onChange={(key) =>
														updateTableState({
															filters: {
																...tableState.filters,
																active:
																	key?.toString() === "all"
																		? undefined
																		: key?.toString(),
															},
														})
													}
													aria-label="Filter by status"
													className="w-full"
													variant="secondary">
													<Select.Trigger>
														<Select.Value />
														<Select.Indicator />
													</Select.Trigger>
													<Select.Popover>
														<ListBox>
															{ENV_STATUS_OPTIONS.map((option) => (
																<ListBox.Item
																	id={option.key}
																	key={option.key}
																	textValue={option.label}>
																	{option.label}
																	<ListBox.ItemIndicator />
																</ListBox.Item>
															))}
														</ListBox>
													</Select.Popover>
												</Select>
											</div>
										</div>
									</Popover.Dialog>
								</Popover.Content>
							</Popover>
						</div>
					</div>

					{activeTags.length > 0 && (
						<div className="flex flex-wrap items-center gap-2 mt-1">
							<TagGroup
								selectionMode="none"
								onRemove={(keys) => {
									const removed = Array.from(keys) as string[];
									removed.forEach((k) => handleRemoveTag(k));
								}}>
								<TagGroup.List className="flex-wrap gap-2">
									{activeTags.map((tag) => (
										<Tag
											key={tag.key}
											id={tag.key}
											textValue={tag.label}
											className="gap-1">
											{tag.label}
											<Tag.RemoveButton>
												<XIcon className="size-3" />
											</Tag.RemoveButton>
										</Tag>
									))}
								</TagGroup.List>
							</TagGroup>
							<Button
								variant="ghost"
								size="sm"
								onPress={handleClearAll}
								className="text-muted-foreground text-xs h-7 px-2">
								Clear all
							</Button>
						</div>
					)}

					<DataTable
						isLoading={isLoading}
						data={filteredEnvs}
						columns={columns}
						state={tableState}
						onStateChange={updateTableState}
						enableRowSelection
						selectedRowIds={selectedIds}
						onSelectionChange={setSelectedIds}
						getRowId={(row) => row.id}
						emptyState={emptyStateContent}
					/>
				</div>
			)}

			<EnvironmentModal
				isOpen={modalOpen}
				onClose={() => setModalOpen(false)}
				environment={editingEnv}
			/>

			<ConfirmModal
				isOpen={!!deletingEnv}
				onOpenChange={(open) => !open && setDeletingEnv(undefined)}
				title={`Delete environment "${deletingEnv?.name}"?`}
				description="Are you sure you want to delete this environment? This action cannot be undone."
				variant="danger"
				confirmText="Yes, delete"
				cancelText="Cancel"
				onConfirm={handleDelete}
				showToast
				toastTitle="Deleted"
				toastMessage={`Environment "${deletingEnv?.name}" has been deleted.`}
				requireRetypeContent={deletingEnv?.slug}
			/>

			<ConfirmModal
				isOpen={batchDeleteModalOpen}
				onOpenChange={setBatchDeleteModalOpen}
				title="Delete environments?"
				description={`Are you sure you want to delete ${selectedIds.length} environment(s)? This action cannot be undone.`}
				variant="danger"
				confirmText="Yes, delete"
				cancelText="Cancel"
				onConfirm={handleBatchDelete}
				showToast
				toastTitle="Deleted"
				toastMessage="Selected environments have been deleted."
				requireRetypeContent={`delete ${selectedIds.length} environments`}
				retypeLabel={`Type "delete ${selectedIds.length} environments" to confirm`}
			/>
		</div>
	);
}
