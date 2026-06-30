"use client";

import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowLeftIcon,
	PlusIcon,
	TrashIcon,
	CopyIcon,
	CheckIcon,
	CodeIcon,
	KeyIcon,
	TerminalWindowIcon,
	BrowserIcon,
	ToggleLeftIcon,
} from "@phosphor-icons/react";
import {
	Badge,
	Button,
	Skeleton,
	Table,
	TableBody,
	TableColumn,
	TableHeader,
	TableRow,
	TableCell,
	Tooltip,
	SearchField,
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
import { EmptyState } from "@/components/ui/EmptyState";
import { PermissionGuard } from "@/components/permission/PermissionGuard";
import { AsyncSwitch } from "@/components/ui/async-switch";
import { CodeSnippetModal } from "@/features/keys/components/CodeSnippetModal";
import type { SdkKey } from "@/types/sdk-key";

export const Route = createFileRoute(
	"/_authenticated/projects/$projectSlug/_admin/sdk-keys",
)({
	component: SdkKeysPage,
});

function SdkKeysPage() {
	const { projectSlug } = Route.useParams();
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [isDisplayOpen, setIsDisplayOpen] = useState(false);
	const [displayedKey, setDisplayedKey] =
		useState<CreateSdkKeyResponse | null>(null);
	const [copiedId, setCopiedId] = useState<string | null>(null);

	// Filters and snippets state
	const [searchQuery, setSearchQuery] = useState("");
	const [typeFilter, setTypeFilter] = useState<"all" | "client" | "server">("all");
	const [selectedKeyForSnippet, setSelectedKeyForSnippet] = useState<SdkKey | null>(null);
	const [isSnippetOpen, setIsSnippetOpen] = useState(false);

	const { data: keys, isPending } = useSdkKeys();
	const createMutation = useCreateSdkKey();
	const toggleMutation = useToggleActiveSdkKey();
	const revokeMutation = useRevokeSdkKey();

	const handleCreate = (data: CreateSdkKeyInput) => {
		createMutation.mutate(data, {
			onSuccess: (res) => {
				setIsCreateOpen(false);
				setDisplayedKey(res);
				setIsDisplayOpen(true);
			},
		});
	};

	const handleRevoke = (keyId: string) => {
		if (window.confirm("Permanently revoke this key? Apps using it will stop working immediately.")) {
			revokeMutation.mutate(keyId);
		}
	};

	const handleCopyMasked = async (id: string, maskedKey: string) => {
		await navigator.clipboard.writeText(maskedKey);
		setCopiedId(id);
		setTimeout(() => setCopiedId(null), 2000);
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
		return matchesSearch && matchesType;
	});

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<Button isIconOnly variant="ghost">
					<Link
						to="/projects/$projectSlug/flags"
						params={{ projectSlug }}
						className="flex items-center justify-center"
					>
						<ArrowLeftIcon className="h-4 w-4" />
					</Link>
				</Button>
				<div className="flex-1">
					<h1 className="text-2xl font-bold text-foreground">SDK Keys</h1>
					<p className="mt-1 text-sm text-default-500">
						Manage authorization keys for your SDKs. Client keys are public;
						server keys must be kept secret.
					</p>
				</div>
				<PermissionGuard
					permission="sdk-key:create"
					mode="disable"
					fallback={
						<Button
							variant="primary"
							className="gap-2"
							isDisabled>
							<PlusIcon className="h-4 w-4" />
							Generate Key
						</Button>
					}>
					<Button
						variant="primary"
						className="gap-2"
						onPress={() => setIsCreateOpen(true)}
					>
						<PlusIcon className="h-4 w-4" />
						Generate Key
					</Button>
				</PermissionGuard>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<div className="flex items-center gap-4 rounded-2xl border border-divider bg-background-secondary p-4 shadow-sm">
					<div className="rounded-xl bg-success-soft p-3 text-success">
						<KeyIcon className="h-6 w-6" />
					</div>
					<div>
						<p className="text-sm font-medium text-default-500">Active Keys</p>
						<p className="text-2xl font-bold text-foreground">{activeCount}</p>
					</div>
				</div>
				<div className="flex items-center gap-4 rounded-2xl border border-divider bg-background-secondary p-4 shadow-sm">
					<div className="rounded-xl bg-default-soft p-3 text-default-600">
						<BrowserIcon className="h-6 w-6" />
					</div>
					<div>
						<p className="text-sm font-medium text-default-500">Client Keys</p>
						<p className="text-2xl font-bold text-foreground">{clientCount}</p>
					</div>
				</div>
				<div className="flex items-center gap-4 rounded-2xl border border-divider bg-background-secondary p-4 shadow-sm">
					<div className="rounded-xl bg-warning-soft p-3 text-warning">
						<TerminalWindowIcon className="h-6 w-6" />
					</div>
					<div>
						<p className="text-sm font-medium text-default-500">Server Keys</p>
						<p className="text-2xl font-bold text-foreground">{serverCount}</p>
					</div>
				</div>
				<div className="flex items-center gap-4 rounded-2xl border border-divider bg-background-secondary p-4 shadow-sm">
					<div className="rounded-xl bg-danger-soft p-3 text-danger">
						<ToggleLeftIcon className="h-6 w-6" />
					</div>
					<div>
						<p className="text-sm font-medium text-default-500">Deactivated</p>
						<p className="text-2xl font-bold text-foreground">{inactiveCount}</p>
					</div>
				</div>
			</div>

			{/* Search and Filters */}
			{keyList.length > 0 && (
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-divider pb-4">
					<SearchField
						variant="secondary"
						value={searchQuery}
						onChange={setSearchQuery}
						aria-label="Search SDK Keys"
						className="w-full max-w-xs"
					>
						<SearchField.Group>
							<SearchField.SearchIcon />
							<SearchField.Input placeholder="Search by name or hint..." />
						</SearchField.Group>
					</SearchField>

					<div className="flex gap-2">
						<Button
							variant={typeFilter === "all" ? "primary" : "outline"}
							onPress={() => setTypeFilter("all")}
							size="sm"
						>
							All
						</Button>
						<Button
							variant={typeFilter === "client" ? "primary" : "outline"}
							onPress={() => setTypeFilter("client")}
							size="sm"
						>
							Client
						</Button>
						<Button
							variant={typeFilter === "server" ? "primary" : "outline"}
							onPress={() => setTypeFilter("server")}
							size="sm"
						>
							Server
						</Button>
					</div>
				</div>
			)}

			{isPending ? (
				<div className="space-y-3">
					{Array.from({ length: 3 }).map((_, i) => (
						<Skeleton key={i} className="h-14 w-full rounded-lg" />
					))}
				</div>
			) : keyList.length === 0 ? (
				<EmptyState
					title="No SDK keys"
					description="Generate your first key to connect your application to Flagix."
					actionLabel="Generate Key"
					onAction={() => setIsCreateOpen(true)}
				/>
			) : filteredKeys.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-12 text-center">
					<p className="text-default-500">No keys matches your search or filter.</p>
				</div>
			) : (
				<Table aria-label="SDK Keys">
					<TableHeader>
						<TableColumn>Name / Creator</TableColumn>
						<TableColumn>Type</TableColumn>
						<TableColumn>Key</TableColumn>
						<TableColumn>Status</TableColumn>
						<TableColumn>Last Used</TableColumn>
						<TableColumn>Created</TableColumn>
						<TableColumn>Actions</TableColumn>
					</TableHeader>
					<TableBody items={filteredKeys}>
						{(key) => (
							<TableRow key={key.id}>
								<TableCell>
									<div className="flex flex-col gap-0.5">
										<span className="font-semibold text-foreground">{key.name}</span>
										{key.creator && (
											<span className="text-xs text-default-500 font-normal">
												by {key.creator.name} ({key.creator.email})
											</span>
										)}
									</div>
								</TableCell>
								<TableCell>
									<Badge
										color={key.type === "server" ? "warning" : "default"}
										variant="soft"
									>
										{key.type}
									</Badge>
								</TableCell>
								<TableCell>
									<div className="flex items-center gap-2">
										<code className="text-xs font-mono text-default-700 bg-background-tertiary px-2 py-0.5 rounded border border-divider">
											{key.maskedKey}
										</code>
										<Tooltip>
											<Tooltip.Trigger>
												<Button
													isIconOnly
													size="sm"
													variant="ghost"
													onPress={() =>
														handleCopyMasked(key.id, key.maskedKey)
													}
												>
													{copiedId === key.id ? (
														<CheckIcon className="h-3 w-3 text-success" />
													) : (
														<CopyIcon className="h-3 w-3" />
													)}
												</Button>
											</Tooltip.Trigger>
											<Tooltip.Content>Copy masked key</Tooltip.Content>
										</Tooltip>

										<Tooltip>
											<Tooltip.Trigger>
												<Button
													isIconOnly
													size="sm"
													variant="ghost"
													onPress={() => {
														setSelectedKeyForSnippet(key);
														setIsSnippetOpen(true);
													}}
												>
													<CodeIcon className="h-3 w-3" />
												</Button>
											</Tooltip.Trigger>
											<Tooltip.Content>Integration snippet</Tooltip.Content>
										</Tooltip>
									</div>
								</TableCell>
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
										actionName={key.isActive ? "Deactivate SDK Key" : "Activate SDK Key"}
										aria-label={`Toggle active state of ${key.name}`}
									/>
								</TableCell>
								<TableCell className="text-sm text-default-600">
									{key.lastUsedAt
										? new Date(key.lastUsedAt).toLocaleString()
										: "Never"}
								</TableCell>
								<TableCell className="text-sm text-default-600">
									{new Date(key.createdAt).toLocaleDateString()}
								</TableCell>
								<TableCell>
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
												<Tooltip.Content>Revoke key (Admins only)</Tooltip.Content>
											</Tooltip>
										}>
										<Tooltip>
											<Tooltip.Trigger>
												<Button
													isIconOnly
													size="sm"
													variant="ghost"
													className="text-danger"
													onPress={() => handleRevoke(key.id)}
												>
													<TrashIcon className="h-4 w-4" />
												</Button>
											</Tooltip.Trigger>
											<Tooltip.Content>Permanently Revoke Key</Tooltip.Content>
										</Tooltip>
									</PermissionGuard>
								</TableCell>
							</TableRow>
						)}
					</TableBody>
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

			{selectedKeyForSnippet && (
				<CodeSnippetModal
					isOpen={isSnippetOpen}
					onClose={() => {
						setIsSnippetOpen(false);
						setSelectedKeyForSnippet(null);
					}}
					rawKey={selectedKeyForSnippet.maskedKey}
					keyType={selectedKeyForSnippet.type}
				/>
			)}
		</div>
	);
}

