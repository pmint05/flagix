import { createFileRoute } from "@tanstack/react-router";
import {
	Button,
	Chip,
	Skeleton,
	Table,
	Tooltip,
	Select,
	ListBox,
	EmptyState as EmptyStateUI,
	SearchField,
	Checkbox,
} from "@heroui/react";
import {
	PlusIcon,
	PencilSimpleIcon,
	TrashSimpleIcon,
	MagnifyingGlassIcon,
	TrayIcon,
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
import { AsyncSwitch } from "@/components/ui/async-switch";
import { useState, useEffect, useMemo } from "react";
import type { Selection, SortDescriptor } from "@heroui/react";
import { useContextStore } from "@/stores";
import type { Environment } from "@/types/environment";
import { formatDistanceToNow } from "date-fns";
import CopyButton from "#/components/ui/copy-button";
import { generateColorFromString } from "#/lib/color-from-string";
import { formatDate } from "#/lib/date";

export const Route = createFileRoute(
	"/_authenticated/projects/$projectSlug/environments",
)({
	component: EnvironmentsIndex,
});

const TYPE_BADGE_COLOR: Record<
	string,
	"success" | "warning" | "accent" | "default"
> = {
	development: "accent",
	staging: "warning",
	production: "success",
	custom: "default",
};

function EnvironmentsIndex() {
	const {
		data: environments,
		isLoading,
		isPending,
		isError,
	} = useEnvironments();
	const toggleActive = useToggleEnvironmentActive();
	const deleteEnvironment = useDeleteEnvironment();
	const { selectedEnvironment, setEnvironment } = useContextStore();

	const [modalOpen, setModalOpen] = useState(false);
	const [batchDeleteModalOpen, setBatchDeleteModalOpen] = useState(false);
	const [editingEnv, setEditingEnv] = useState<Environment | undefined>();
	const [deletingEnv, setDeletingEnv] = useState<Environment | undefined>();

	const [searchQuery, setSearchQuery] = useState("");
	const [typeFilter, setTypeFilter] = useState<string>("all");
	const [activeFilter, setActiveFilter] = useState<string>("all");

	const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set());
	const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
		column: "name",
		direction: "ascending",
	});

	// Auto-select first environment when none is selected
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

	const envs = environments ?? [];
	const filteredEnvs = envs.filter((env) => {
		const matchesSearch =
			env.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			env.slug.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesType = typeFilter === "all" || env.type === typeFilter;
		const matchesActive =
			activeFilter === "all" ||
			(activeFilter === "active" ? env.isActive : !env.isActive);
		return matchesSearch && matchesType && matchesActive;
	});

	const sortedEnvs = useMemo(() => {
		let items = [...filteredEnvs];

		items.sort((a, b) => {
			let cmp = 0;
			switch (sortDescriptor.column) {
				case "name":
					cmp = a.name.localeCompare(b.name);
					break;
				case "slug":
					cmp = a.slug.localeCompare(b.slug);
					break;
				case "createdAt":
					cmp =
						new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
					break;
				case "updatedAt":
					cmp =
						new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
					break;
			}
			return sortDescriptor.direction === "descending" ? -cmp : cmp;
		});

		return items;
	}, [sortDescriptor, filteredEnvs]);

	const handleDelete = async () => {
		if (!deletingEnv) return;
		await deleteEnvironment.mutateAsync(deletingEnv.id);
		setDeletingEnv(undefined);
	};

	const handleBatchDelete = async () => {
		const keys =
			selectedKeys === "all"
				? sortedEnvs.map((e) => e.id)
				: (Array.from(selectedKeys) as string[]);
		if (keys.length === 0) return;
		await Promise.all(keys.map((id) => deleteEnvironment.mutateAsync(id)));
		setSelectedKeys(new Set());
	};

	const handleBatchToggleActive = async (active: boolean) => {
		const keys =
			selectedKeys === "all"
				? sortedEnvs.map((e) => e.id)
				: (Array.from(selectedKeys) as string[]);
		const mutations = keys.map((id) => {
			const env = sortedEnvs.find((e) => e.id === id);
			if (env && env.isActive !== active) {
				return toggleActive.mutateAsync({ id, isActive: active });
			}
			return Promise.resolve();
		});
		await Promise.all(mutations);
		setSelectedKeys(new Set());
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<div className="flex-1">
					<h1 className="text-2xl font-bold text-foreground">Environments</h1>
					<p className="mt-1 text-sm">
						Manage deployment environments for this project
					</p>
				</div>
				{(selectedKeys === "all" || selectedKeys.size > 0) && (
					<div className="flex items-center gap-2 mr-2">
						<span className="text-sm text-muted-foreground mr-2">
							{selectedKeys === "all" ? sortedEnvs.length : selectedKeys.size}{" "}
							selected
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

			{isPending ? (
				<div className="space-y-3">
					{Array.from({ length: 3 }).map((_, i) => (
						<Skeleton key={i} className="h-14 w-full rounded-lg" />
					))}
				</div>
			) : isError ? (
				<div className="rounded-lg border border-danger-200 bg-danger-50 p-4 text-danger">
					Failed to load environments. Please try again.
				</div>
			) : envs.length === 0 ? (
				<EmptyState
					title="No environments yet"
					description="Set up deployment environments (e.g. Development, Staging, Production) to manage feature flags per target."
					actionLabel="Create Environment"
					onAction={handleCreate}
				/>
			) : (
				<div className="space-y-4">
					<div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
						<SearchField
							value={searchQuery}
							onChange={setSearchQuery}
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
							<Select
								value={typeFilter}
								onChange={(key) => key && setTypeFilter(key.toString())}
								aria-label="Filter by type"
								className="w-full sm:w-40"
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
											</ListBox.Item>
										))}
									</ListBox>
								</Select.Popover>
							</Select>

							<Select
								value={activeFilter}
								onChange={(key) => key && setActiveFilter(key.toString())}
								aria-label="Filter by status"
								className="w-full sm:w-40"
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
											</ListBox.Item>
										))}
									</ListBox>
								</Select.Popover>
							</Select>
						</div>
					</div>

					<Table aria-label="Environments list">
						<Table.ScrollContainer>
							<Table.Content
								aria-label="Environments list content"
								className="h-full"
								selectionMode="multiple"
								selectedKeys={selectedKeys}
								onSelectionChange={setSelectedKeys}
								sortDescriptor={sortDescriptor}
								onSortChange={setSortDescriptor}>
								<Table.Header>
									<Table.Column className="pr-0">
										<Checkbox aria-label="Select all" slot="selection">
											<Checkbox.Content>
												<Checkbox.Control>
													<Checkbox.Indicator />
												</Checkbox.Control>
											</Checkbox.Content>
										</Checkbox>
									</Table.Column>
									<Table.Column id="name" isRowHeader allowsSorting>
										{({ sortDirection }) => (
											<Table.SortableColumnHeader sortDirection={sortDirection}>
												Name
											</Table.SortableColumnHeader>
										)}
									</Table.Column>
									<Table.Column id="slug" allowsSorting>
										{({ sortDirection }) => (
											<Table.SortableColumnHeader sortDirection={sortDirection}>
												Slug
											</Table.SortableColumnHeader>
										)}
									</Table.Column>
									<Table.Column id="type">Type</Table.Column>
									<Table.Column id="description">Description</Table.Column>
									<Table.Column id="isActive">Active</Table.Column>
									<Table.Column id="createdAt" allowsSorting>
										{({ sortDirection }) => (
											<Table.SortableColumnHeader sortDirection={sortDirection}>
												Created
											</Table.SortableColumnHeader>
										)}
									</Table.Column>
									<Table.Column id="updatedAt" allowsSorting>
										{({ sortDirection }) => (
											<Table.SortableColumnHeader sortDirection={sortDirection}>
												Updated
											</Table.SortableColumnHeader>
										)}
									</Table.Column>
									<Table.Column id="actions">Actions</Table.Column>
								</Table.Header>
								<Table.Body
									items={sortedEnvs}
									renderEmptyState={() => (
										<EmptyStateUI className="flex h-full w-full flex-col items-center justify-center gap-4 text-center min-h-50">
											<TrayIcon className="size-8 text-muted" />
											<span className="text-muted">
												No results matching the current filters.
											</span>
										</EmptyStateUI>
									)}>
									{(env) => (
										<Table.Row key={env.id} id={env.id}>
											<Table.Cell className="pr-0">
												<Checkbox
													aria-label={`Select ${env.id}`}
													slot="selection"
													variant="secondary">
													<Checkbox.Content>
														<Checkbox.Control>
															<Checkbox.Indicator />
														</Checkbox.Control>
													</Checkbox.Content>
												</Checkbox>
											</Table.Cell>
											<Table.Cell>
												<div className="flex items-center gap-2">
													<div
														className="size-3 rounded-full"
														style={{
															backgroundColor: generateColorFromString(
																env.name,
															),
														}}
													/>

													<span className="font-medium text-foreground">
														{env.name}
													</span>
												</div>
											</Table.Cell>
											<Table.Cell>
												<div className="flex items-center gap-2 group">
													<span className="text-muted-foreground">
														{env.slug}
													</span>
													<CopyButton
														text={env.slug}
														buttonProps={{
															className:
																"size-8 group-hover:opacity-100 opacity-0 transition-opacity",
														}}
													/>
												</div>
											</Table.Cell>
											<Table.Cell>
												<Chip
													color={TYPE_BADGE_COLOR[env.type] ?? "default"}
													variant="soft">
													{env.type}
												</Chip>
											</Table.Cell>
											<Table.Cell className="max-w-30">
												<Tooltip>
													<Tooltip.Trigger className="min-w-0 truncate block">
														<span className="truncate min-w-0 block text-muted-foreground">
															{env.description || "--"}
														</span>
													</Tooltip.Trigger>
													<Tooltip.Content>
														<pre>{env.description || "No description"}</pre>
													</Tooltip.Content>
												</Tooltip>
											</Table.Cell>
											<Table.Cell>
												<AsyncSwitch
													isSelected={env.isActive}
													action={() => handleToggleActive(env)}
													size="sm"
													showToast
													actionName="Toggle Status"
													message={`Environment ${env.name} is now ${!env.isActive ? 'active' : 'inactive'}`}
												/>
											</Table.Cell>
											<Table.Cell>
												<Tooltip>
													<Tooltip.Trigger>
														<span className="text-muted-foreground">
															{formatDistanceToNow(new Date(env.createdAt), {
																addSuffix: true,
															})}
														</span>
													</Tooltip.Trigger>
													<Tooltip.Content>
														{formatDate(env.createdAt)}
													</Tooltip.Content>
												</Tooltip>
											</Table.Cell>
											<Table.Cell>
												<Tooltip>
													<Tooltip.Trigger>
														<span className="text-muted-foreground">
															{formatDistanceToNow(new Date(env.updatedAt), {
																addSuffix: true,
															})}
														</span>
													</Tooltip.Trigger>
													<Tooltip.Content>
														{formatDate(env.updatedAt)}
													</Tooltip.Content>
												</Tooltip>
											</Table.Cell>
											<Table.Cell>
												<div className="flex items-center gap-1">
													<Tooltip>
														<Tooltip.Trigger>
															<Button
																isIconOnly
																variant="ghost"
																size="sm"
																onPress={() => handleEdit(env)}>
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
																onPress={() => setDeletingEnv(env)}>
																<TrashSimpleIcon className="size-4" />
															</Button>
														</Tooltip.Trigger>
														<Tooltip.Content>Delete</Tooltip.Content>
													</Tooltip>
												</div>
											</Table.Cell>
										</Table.Row>
									)}
								</Table.Body>
							</Table.Content>
						</Table.ScrollContainer>
					</Table>
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
			/>

			<ConfirmModal
				isOpen={batchDeleteModalOpen}
				onOpenChange={setBatchDeleteModalOpen}
				title="Delete environments?"
				description={`Are you sure you want to delete ${selectedKeys === "all" ? sortedEnvs.length : selectedKeys.size} environment(s)? This action cannot be undone.`}
				variant="danger"
				confirmText="Yes, delete"
				cancelText="Cancel"
				onConfirm={handleBatchDelete}
				showToast
				toastTitle="Deleted"
				toastMessage="Selected environments have been deleted."
			/>
		</div>
	);
}
