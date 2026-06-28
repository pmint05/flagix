"use client";

import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowLeft,
	Plus,
	Trash,
	Copy,
	Check,
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
} from "@heroui/react";
import { useSdkKeys, useCreateSdkKey, useRevokeSdkKey } from "@/features/keys";
import type { CreateSdkKeyInput } from "@/features/keys";
import type { CreateSdkKeyResponse } from "@/features/keys/api";
import { KeyModal } from "@/features/keys/KeyModal";
import { KeyDisplay } from "@/features/keys/KeyDisplay";
import { EmptyState } from "@/components/ui/EmptyState";
import { PermissionGuard } from "@/components/permission/PermissionGuard";

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

	const { data: keys, isLoading } = useSdkKeys();
	const createMutation = useCreateSdkKey();
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
		if (window.confirm("Revoke this key? The SDK using it will stop working.")) {
			revokeMutation.mutate(keyId);
		}
	};

	const handleCopyMasked = async (id: string, maskedKey: string) => {
		await navigator.clipboard.writeText(maskedKey);
		setCopiedId(id);
		setTimeout(() => setCopiedId(null), 2000);
	};

	const keyList = keys ?? [];

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<Button isIconOnly variant="ghost">
					<Link
						to="/projects/$projectSlug/flags"
						params={{ projectSlug }}
						className="flex items-center justify-center"
					>
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				<div className="flex-1">
					<h1 className="text-2xl font-bold text-foreground">SDK Keys</h1>
					<p className="mt-1 text-sm">
						Manage authentication keys for your SDKs. Client keys are public;
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
							<Plus className="h-4 w-4" />
							Generate Key
						</Button>
					}>
					<Button
						variant="primary"
						className="gap-2"
						onPress={() => setIsCreateOpen(true)}
					>
						<Plus className="h-4 w-4" />
						Generate Key
					</Button>
				</PermissionGuard>
			</div>

			{isLoading ? (
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
			) : (
				<Table aria-label="SDK Keys">
					<TableHeader>
						<TableColumn>Name</TableColumn>
						<TableColumn>Type</TableColumn>
						<TableColumn>Key</TableColumn>
						<TableColumn>Status</TableColumn>
						<TableColumn>Created</TableColumn>
						<TableColumn>Actions</TableColumn>
					</TableHeader>
					<TableBody items={keyList}>
						{(key) => (
							<TableRow key={key.id}>
								<TableCell>
									<span className="font-medium text-foreground">{key.name}</span>
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
										<code className="text-sm">
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
														<Check className="h-3 w-3 text-success" />
													) : (
														<Copy className="h-3 w-3" />
													)}
												</Button>
											</Tooltip.Trigger>
											<Tooltip.Content>Copy masked key</Tooltip.Content>
										</Tooltip>
									</div>
								</TableCell>
								<TableCell>
									<Badge
										color={key.isActive ? "success" : "danger"}
										variant="soft"
									>
										{key.isActive ? "Active" : "Revoked"}
									</Badge>
								</TableCell>
								<TableCell className="text-sm">
									{new Date(key.createdAt).toLocaleDateString()}
								</TableCell>
								<TableCell>
									{key.isActive && (
										<PermissionGuard
											permission={"sdk-key:delete"}
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
															<Trash className="h-4 w-4" />
														</Button>
													</Tooltip.Trigger>
													<Tooltip.Content>Revoke key</Tooltip.Content>
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
														<Trash className="h-4 w-4" />
													</Button>
												</Tooltip.Trigger>
												<Tooltip.Content>Revoke key</Tooltip.Content>
											</Tooltip>
										</PermissionGuard>
									)}
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
		</div>
	);
}
