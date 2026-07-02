"use client";

import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
	PlusIcon,
	TrashIcon,
	CodeIcon,
	KeyIcon,
	TerminalWindowIcon,
	BrowserIcon,
	ToggleLeftIcon,
	EyeIcon,
	EyeSlashIcon,
	FadersIcon,
	XIcon,
} from "@phosphor-icons/react";
import {
	Chip,
	Button,
	Skeleton,
	Table,
	TableCell,
	Tooltip,
	SearchField,
	EmptyState,
	Input,
	Select,
	ListBox,
	Popover,
	TagGroup,
	Tag,
} from "@heroui/react";
import {
	useSdkKeys,
	useCreateSdkKey,
	useToggleActiveSdkKey,
	useRevokeSdkKey,
} from "@/features/keys";
import type { CreateSdkKeyInput } from "@/features/keys";
import type { CreateSdkKeyResponse } from "@/features/keys/api";
import { KeyModal } from "@/features/keys/KeyModal";
import { KeyDisplay } from "@/features/keys/KeyDisplay";
import { PermissionGuard } from "@/components/permission/PermissionGuard";
import { AsyncSwitch } from "@/components/ui/async-switch";
import { StatCard } from "@/components/ui/stat-card";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { CodeSnippetModal } from "@/features/keys/components/CodeSnippetModal";
import type { SdkKey } from "@/types/sdk-key";
import { formatDistanceToNow } from "date-fns";
import { formatDate } from "#/lib/date";
import UserAvatar from "#/components/user/user-avatar";
import CopyButton from "#/components/ui/copy-button";

function KeyInputCell({ sdkKey }: { sdkKey: SdkKey }) {
	const [revealed, setRevealed] = useState(false);

	if (sdkKey.type === "server") {
		return (
			<div className="flex items-center gap-2">
				<Input
					variant="secondary"
					readOnly
					value={sdkKey.maskedKey}
					type="text"
					className="font-mono text-xs w-full h-8 max-w-96"
				/>
			</div>
		);
	}

	const keyValue = sdkKey.rawKey || sdkKey.maskedKey;

	return (
		<div className="flex items-center gap-2">
			<Input
				variant="secondary"
				readOnly
				value={keyValue}
				type={revealed ? "text" : "password"}
				className="font-mono text-xs w-full h-8 max-w-96"
			/>
			<Tooltip>
				<Tooltip.Trigger>
					<Button
						isIconOnly
						size="sm"
						variant="ghost"
						onPress={() => setRevealed(!revealed)}>
						{revealed ? (
							<EyeSlashIcon className="h-4 w-4" />
						) : (
							<EyeIcon className="h-4 w-4" />
						)}
					</Button>
				</Tooltip.Trigger>
				<Tooltip.Content>{revealed ? "Hide key" : "Show key"}</Tooltip.Content>
			</Tooltip>
			<Tooltip>
				<Tooltip.Trigger>
					<CopyButton text={keyValue} buttonProps={{}} />
				</Tooltip.Trigger>
				<Tooltip.Content>Copy key</Tooltip.Content>
			</Tooltip>
		</div>
	);
}

export const Route = createFileRoute(
	"/_authenticated/projects/$projectSlug/_admin/sdk-keys",
)({
	component: SdkKeysPage,
});

function SdkKeysPage() {
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [isDisplayOpen, setIsDisplayOpen] = useState(false);
	const [displayedKey, setDisplayedKey] = useState<CreateSdkKeyResponse | null>(
		null,
	);
	const [revokingKey, setRevokingKey] = useState<SdkKey | null>(null);

	// Filters and snippets state
	const [searchQuery, setSearchQuery] = useState("");
	const [typeFilter, setTypeFilter] = useState<"all" | "client" | "server">(
		"all",
	);
	const [statusFilter, setStatusFilter] = useState<
		"all" | "active" | "inactive"
	>("all");
	const [isSnippetOpen, setIsSnippetOpen] = useState(false);

	const { data: keys, isPending } = useSdkKeys();
	const createMutation = useCreateSdkKey();
	const toggleMutation = useToggleActiveSdkKey();
	const revokeMutation = useRevokeSdkKey();

	const handleCreate = (data: CreateSdkKeyInput) => {
		createMutation.mutate(data, {
			onSuccess: (res) => {
				setIsCreateOpen(false);
				if (data.type === "server") {
					setDisplayedKey(res);
					setIsDisplayOpen(true);
				} else {
					setDisplayedKey(null);
				}
			},
		});
	};

	const handleRevoke = (key: SdkKey) => {
		setRevokingKey(key);
	};

	const keyList = keys ?? [];

	// Compute statistics
	const activeCount = keyList.filter((k) => k.isActive).length;
	const clientCount = keyList.filter((k) => k.type === "client").length;
	const serverCount = keyList.filter((k) => k.type === "server").length;
	const inactiveCount = keyList.filter((k) => !k.isActive).length;

	// Filter key list
	const filteredKeys = keyList.filter((key) => {
		const matchesSearch =
			key.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			key.keyHint.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesType = typeFilter === "all" || key.type === typeFilter;
		const matchesStatus =
			statusFilter === "all" ||
			(statusFilter === "active" ? key.isActive : !key.isActive);
		return matchesSearch && matchesType && matchesStatus;
	});

	const activeTags = useMemo(() => {
		const tags: Array<{ key: string; label: string }> = [];
		if (typeFilter !== "all") {
			tags.push({
				key: "type",
				label: `Type: ${typeFilter === "client" ? "Client" : "Server"}`,
			});
		}
		if (statusFilter !== "all") {
			tags.push({
				key: "status",
				label: `Status: ${statusFilter === "active" ? "Active" : "Inactive"}`,
			});
		}
		return tags;
	}, [typeFilter, statusFilter]);

	const handleRemoveTag = (key: string) => {
		if (key === "type") setTypeFilter("all");
		if (key === "status") setStatusFilter("all");
	};

	const handleClearAll = () => {
		setTypeFilter("all");
		setStatusFilter("all");
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<div className="flex-1">
					<h1 className="text-2xl font-bold text-foreground">SDK Keys</h1>
					<p className="mt-1 text-sm text-default-500">
						Manage authorization keys for your SDKs. Client keys are public;
						server keys must be kept secret.
					</p>
				</div>
				<Button
					variant="outline"
					className="gap-2"
					onPress={() => setIsSnippetOpen(true)}>
					<CodeIcon className="h-4 w-4" />
					Code Snippets
				</Button>
				<PermissionGuard
					permission="sdk-key:create"
					mode="disable"
					fallback={
						<Button variant="primary" className="gap-2" isDisabled>
							<PlusIcon className="h-4 w-4" />
							Generate Key
						</Button>
					}>
					<Button
						variant="primary"
						className="gap-2"
						onPress={() => setIsCreateOpen(true)}>
						<PlusIcon className="h-4 w-4" />
						Generate Key
					</Button>
				</PermissionGuard>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<StatCard
					title="Active Keys"
					value={activeCount}
					icon={KeyIcon}
					iconClassName="rounded-xl bg-success-soft p-3 text-success"
				/>
				<StatCard
					title="Client Keys"
					value={clientCount}
					icon={BrowserIcon}
					iconClassName="rounded-xl bg-default-soft p-3 text-default-600"
				/>
				<StatCard
					title="Server Keys"
					value={serverCount}
					icon={TerminalWindowIcon}
					iconClassName="rounded-xl bg-warning-soft p-3 text-warning"
				/>
				<StatCard
					title="Deactivated"
					value={inactiveCount}
					icon={ToggleLeftIcon}
					iconClassName="rounded-xl bg-danger-soft p-3 text-danger"
				/>
			</div>

			{/* Search and Filters */}
			{keyList.length > 0 && (
				<div className="flex flex-col gap-3">
					<div className={"flex gap-2 items-center"}>
						<SearchField
							variant="secondary"
							value={searchQuery}
							onChange={setSearchQuery}
							aria-label="Search SDK Keys"
							className="w-full max-w-xs">
							<SearchField.Group>
								<SearchField.SearchIcon />
								<SearchField.Input placeholder="Search by name or hint..." />
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
											Filter SDK Keys
										</div>
										<div className="flex flex-col gap-3">
											<div className="flex flex-col gap-1.5">
												<span className="text-xs font-medium text-muted-foreground">
													Type
												</span>
												<Select
													value={typeFilter}
													onChange={(key) =>
														setTypeFilter((key?.toString() || "all") as any)
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
															<ListBox.Item
																id="all"
																key="all"
																textValue="All Types">
																All Types
																<ListBox.ItemIndicator />
															</ListBox.Item>
															<ListBox.Item
																id="client"
																key="client"
																textValue="Client">
																Client
																<ListBox.ItemIndicator />
															</ListBox.Item>
															<ListBox.Item
																id="server"
																key="server"
																textValue="Server">
																Server
																<ListBox.ItemIndicator />
															</ListBox.Item>
														</ListBox>
													</Select.Popover>
												</Select>
											</div>

											<div className="flex flex-col gap-1.5">
												<span className="text-xs font-medium text-muted-foreground">
													Status
												</span>
												<Select
													value={statusFilter}
													onChange={(key) =>
														setStatusFilter((key?.toString() || "all") as any)
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
															<ListBox.Item
																id="all"
																key="all"
																textValue="All Statuses">
																All Statuses
																<ListBox.ItemIndicator />
															</ListBox.Item>
															<ListBox.Item
																id="active"
																key="active"
																textValue="Active">
																Active
																<ListBox.ItemIndicator />
															</ListBox.Item>
															<ListBox.Item
																id="inactive"
																key="inactive"
																textValue="Inactive">
																Inactive
																<ListBox.ItemIndicator />
															</ListBox.Item>
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
						<div className="flex flex-wrap items-center gap-2 mt-1 border-b border-divider pb-4">
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
				</div>
			)}

			{isPending ? (
				<div className="space-y-3">
					{Array.from({ length: 3 }).map((_, i) => (
						<Skeleton key={i} className="h-14 w-full rounded-lg" />
					))}
				</div>
			) : (
				<Table aria-label="SDK Keys">
					<Table.ScrollContainer>
						<Table.Content>
							<Table.Header>
								<Table.Column isRowHeader>Name</Table.Column>
								<Table.Column>Type</Table.Column>
								<Table.Column>Key</Table.Column>
								<Table.Column>Status</Table.Column>
								<Table.Column>Last Used</Table.Column>
								<Table.Column>Created By</Table.Column>
								<Table.Column>Created</Table.Column>
								<Table.Column>Actions</Table.Column>
							</Table.Header>
							<Table.Body
								items={filteredKeys}
								renderEmptyState={() => (
									<EmptyState title="No SDK Keys Found" className="min-h-32">
										{!keyList.length && (
											<div className="text-center flex flex-col items-center gap-2">
												<h3 className="font-semibold text-foreground">
													No SDK Keys Found
												</h3>
												<p>Generate a new SDK key to get started.</p>
												<PermissionGuard
													permission="sdk-key:create"
													mode="disable"
													fallback={
														<Button variant="primary" isDisabled>
															<PlusIcon className="h-4 w-4" />
															Generate Key
														</Button>
													}>
													<Button
														variant="primary"
														onPress={() => setIsCreateOpen(true)}
														className="gap-2">
														<PlusIcon className="h-4 w-4" />
														Generate Key
													</Button>
												</PermissionGuard>
											</div>
										)}
										{filteredKeys.length === 0 && keyList.length > 0 && (
											<div className="text-center flex flex-col items-center gap-2">
												<h3 className="font-semibold text-foreground">
													No SDK Keys Match Your Filters
												</h3>
												<p>
													Try adjusting your search or filter settings to find
													what you're looking for.
												</p>
											</div>
										)}
									</EmptyState>
								)}>
								{(key) => (
									<Table.Row key={key.id}>
										<Table.Cell>
											<span className="font-semibold text-foreground">
												{key.name}
											</span>
										</Table.Cell>
										<Table.Cell>
											<Chip
												color={
													key.type === "server"
														? "warning"
														: key.type === "client"
															? "accent"
															: "default"
												}
												variant="soft">
												{key.type}
											</Chip>
										</Table.Cell>
										<Table.Cell>
											<KeyInputCell sdkKey={key} />
										</Table.Cell>
										<TableCell>
											<AsyncSwitch
												isSelected={key.isActive}
												action={async () => {
													await toggleMutation.mutateAsync({
														keyId: key.id,
														isActive: !key.isActive,
													});
												}}
												showToast
												actionName={
													key.isActive
														? "Deactivate SDK Key"
														: "Activate SDK Key"
												}
												aria-label={`Toggle active state of ${key.name}`}
											/>
										</TableCell>
										<TableCell className="text-sm text-default-600">
											{key.lastUsedAt
												? formatDistanceToNow(new Date(key.lastUsedAt), {
														addSuffix: true,
													})
												: "Never"}
										</TableCell>
										<Table.Cell>
											{key.creator ? (
												<div className="flex items-center gap-2">
													<UserAvatar
														user={key.creator}
														size="sm"
														className="size-6"
														fallbackClassName="text-xs"
													/>
													<div className="flex flex-col">
														<span className="text-sm font-medium text-foreground">
															{key.creator.name}
														</span>
														<span className="text-xs text-default-400">
															{key.creator.email}
														</span>
													</div>
												</div>
											) : (
												<span className="text-sm text-default-400">System</span>
											)}
										</Table.Cell>
										<TableCell className="text-sm text-default-600">
											{formatDate(key.createdAt)}
										</TableCell>
										<Table.Cell>
											<PermissionGuard
												permission="sdk-key:delete"
												mode="disable"
												fallback={
													<Tooltip>
														<Tooltip.Trigger>
															<Button
																isIconOnly
																size="sm"
																variant="ghost"
																className="text-danger"
																isDisabled>
																<TrashIcon className="h-4 w-4" />
															</Button>
														</Tooltip.Trigger>
														<Tooltip.Content>
															Revoke key (Admins only)
														</Tooltip.Content>
													</Tooltip>
												}>
												<Tooltip>
													<Tooltip.Trigger>
														<Button
															isIconOnly
															size="sm"
															variant="ghost"
															className="text-danger"
															onPress={() => handleRevoke(key)}>
															<TrashIcon className="h-4 w-4" />
														</Button>
													</Tooltip.Trigger>
													<Tooltip.Content>
														Permanently Revoke Key
													</Tooltip.Content>
												</Tooltip>
											</PermissionGuard>
										</Table.Cell>
									</Table.Row>
								)}
							</Table.Body>
						</Table.Content>
					</Table.ScrollContainer>
				</Table>
			)}

			<KeyModal
				isOpen={isCreateOpen}
				onClose={() => setIsCreateOpen(false)}
				onSubmit={handleCreate}
				isLoading={createMutation.isPending}
			/>

			<KeyDisplay
				isOpen={isDisplayOpen}
				onClose={() => {
					setIsDisplayOpen(false);
					setDisplayedKey(null);
				}}
				createdKey={displayedKey}
			/>

			<CodeSnippetModal
				isOpen={isSnippetOpen}
				onClose={() => setIsSnippetOpen(false)}
				keys={keyList}
			/>

			<ConfirmModal
				isOpen={!!revokingKey}
				onOpenChange={(open) => !open && setRevokingKey(null)}
				title={`Revoke SDK Key "${revokingKey?.name}"?`}
				description="Are you sure you want to permanently revoke this key? Apps using it will stop working immediately."
				variant="danger"
				confirmText="Revoke"
				cancelText="Cancel"
				onConfirm={async () => {
					if (revokingKey) {
						await revokeMutation.mutateAsync(revokingKey.id);
						setRevokingKey(null);
					}
				}}
			/>
		</div>
	);
}
