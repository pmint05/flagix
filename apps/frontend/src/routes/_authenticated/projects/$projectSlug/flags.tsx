import { createFileRoute, Link, useMatch } from "@tanstack/react-router";
import {
	Badge,
	Button,
	Input,
	Label,
	Skeleton,
	Table,
	TableBody,
	TableColumn,
	TableHeader,
	TableRow,
	TableCell,
	TextField,
	Tooltip,
} from "@heroui/react";
import {
	ArrowLeftIcon,
	PlusIcon,
	TrashIcon,
	WarningIcon,
} from "@phosphor-icons/react";
import {
	useFlags,
	useDeleteFlag,
	useUpdateFlagState,
} from "@/features/flags/api";
import { FlagToggle } from "@/features/flags/FlagToggle";
import { FlagModal } from "@/features/flags/FlagModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { useState } from "react";
import type { FeatureFlagListItem } from "@/types/feature-flag";

export const Route = createFileRoute(
	"/_authenticated/projects/$projectSlug/flags",
)({
	component: FlagsIndex,
});

const STATUS_BADGE_COLOR: Record<
	string,
	"success" | "warning" | "danger" | "default"
> = {
	draft: "default",
	active: "success",
	archived: "danger",
};

function FlagsIndex() {
	const match = useMatch({
		from: "/_authenticated/projects/$projectSlug/flags",
	});
	const { projectSlug } = match.params;
	const [statusFilter, setStatusFilter] = useState<string | undefined>(
		undefined,
	);
	const { data: flags, isLoading, isError } = useFlags(statusFilter);
	const deleteFlag = useDeleteFlag();
	const updateFlagState = useUpdateFlagState();

	const [search, setSearch] = useState("");
	const [modalOpen, setModalOpen] = useState(false);

	const handleCreate = () => {
		setModalOpen(true);
	};

	const handleDelete = (flag: FeatureFlagListItem) => {
		deleteFlag.mutate(flag.id);
	};

	const handleStatusChange = (
		flag: FeatureFlagListItem,
		newStatus: "draft" | "active" | "archived",
	) => {
		updateFlagState.mutate({
			flagId: flag.id,
			status: newStatus,
		});
	};

	const flagList = flags ?? [];
	const filteredFlags = search
		? flagList.filter(
				(f) =>
					f.key.toLowerCase().includes(search.toLowerCase()) ||
					f.name.toLowerCase().includes(search.toLowerCase()),
			)
		: flagList;

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
				<Button
					size="sm"
					variant={statusFilter === undefined ? "primary" : "ghost"}
					onPress={() => setStatusFilter(undefined)}>
					All
				</Button>
				<Button
					size="sm"
					variant={statusFilter === "draft" ? "primary" : "ghost"}
					onPress={() => setStatusFilter("draft")}>
					Draft
				</Button>
				<Button
					size="sm"
					variant={statusFilter === "active" ? "primary" : "ghost"}
					onPress={() => setStatusFilter("active")}>
					Active
				</Button>
				<Button
					size="sm"
					variant={statusFilter === "archived" ? "primary" : "ghost"}
					onPress={() => setStatusFilter("archived")}>
					Archived
				</Button>
			</div>

			<TextField>
				<Label>Search flags</Label>
				<Input
					placeholder="Search by key or name"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
				/>
			</TextField>

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
			) : filteredFlags.length === 0 ? (
				<EmptyState
					title="No feature flags yet"
					description="Create your first feature flag to start controlling feature rollouts."
					actionLabel="New Flag"
					onAction={handleCreate}
				/>
			) : (
				<Table aria-label="Feature flags list">
					<TableHeader>
						<TableColumn>Key</TableColumn>
						<TableColumn>Name</TableColumn>
						<TableColumn>Type</TableColumn>
						<TableColumn>Status</TableColumn>
						<TableColumn>Enabled</TableColumn>
						<TableColumn>Actions</TableColumn>
					</TableHeader>
					<TableBody items={filteredFlags}>
						{(flag) => (
							<TableRow key={flag.id}>
								<TableCell>
									<code className="text-sm ">{flag.key}</code>
								</TableCell>
								<TableCell>
									<span className="font-medium text-foreground">
										{flag.name}
									</span>
								</TableCell>
								<TableCell>
									<Badge variant="soft">{flag.flagType}</Badge>
								</TableCell>
								<TableCell>
									<Badge
										color={STATUS_BADGE_COLOR[flag.status] ?? "default"}
										variant="soft">
										{flag.status}
									</Badge>
								</TableCell>
								<TableCell>
									<FlagToggle flagId={flag.id} isEnabled={flag.isEnabled} />
								</TableCell>
								<TableCell>
									<div className="flex items-center gap-1">
										{flag.status === "draft" && (
											<Tooltip>
												<Tooltip.Trigger>
													<Button
														isIconOnly
														variant="ghost"
														size="sm"
														onPress={() => handleStatusChange(flag, "active")}>
														<WarningIcon className="h-4 w-4" />
													</Button>
												</Tooltip.Trigger>
												<Tooltip.Content>Activate</Tooltip.Content>
											</Tooltip>
										)}
										<Tooltip>
											<Tooltip.Trigger>
												<Button
													isIconOnly
													variant="ghost"
													size="sm"
													className="text-danger"
													onPress={() => handleDelete(flag)}>
													<TrashIcon className="h-4 w-4" />
												</Button>
											</Tooltip.Trigger>
											<Tooltip.Content>Delete</Tooltip.Content>
										</Tooltip>
									</div>
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			)}

			<FlagModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
		</div>
	);
}
