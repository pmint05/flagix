import { createFileRoute, Link, useMatch } from "@tanstack/react-router";
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
	toast,
} from "@heroui/react";
import {
	ArrowLeftIcon,
	PencilIcon,
	CopyIcon,
	TrashIcon,
} from "@phosphor-icons/react";
import { useState, useMemo } from "react";
import { useFlag, useDeleteFlag } from "@/features/flags/api";
import { useEnvironments } from "@/features/environments/api";
import { FlagModal } from "@/features/flags/FlagModal";
import { TargetingRules } from "@/features/rules/TargetingRules";
import type { Variation } from "@/types/feature-flag";

export const Route = createFileRoute(
	"/_authenticated/projects/$projectId/flags/$flagId",
)({
	component: FlagDetail,
});

const STATUS_BADGE_COLOR: Record<
	string,
	"success" | "warning" | "danger" | "default"
> = {
	draft: "default",
	active: "success",
	archived: "danger",
};

function FlagDetail() {
	const match = useMatch({
		from: "/_authenticated/projects/$projectId/flags/$flagId",
	});
	const { projectId, flagId } = match.params;

	const { data: flag, isLoading, isError } = useFlag(flagId);
	const deleteFlag = useDeleteFlag();
	const { data: environments } = useEnvironments();

	const [editModalOpen, setEditModalOpen] = useState(false);
	const [copiedKey, setCopiedKey] = useState(false);

	const envStates = useMemo(() => {
		if (!flag) return [];
		const envs = environments ?? [];
		return envs.map((env) => {
			const state = flag.states?.find((s) => s.environmentId === env.id);
			return {
				...env,
				isEnabled: state?.isEnabled ?? false,
				status: state?.status ?? "draft",
			};
		});
	}, [flag, environments]);

	const handleCopyKey = () => {
		if (flag?.key) {
			navigator.clipboard.writeText(flag.key);
			setCopiedKey(true);
			setTimeout(() => setCopiedKey(false), 2000);
		}
	};

	const handleDelete = async () => {
		if (!flag) return;
		try {
			await deleteFlag.mutateAsync(flag.id);
			toast.success("Feature flag deleted");
		} catch {
			toast.danger("Failed to delete feature flag");
		}
	};

	const getVariationValue = (variation: Variation): string => {
		if (typeof variation.value === "boolean")
			return variation.value ? "true" : "false";
		if (typeof variation.value === "string") return variation.value;
		return JSON.stringify(variation.value);
	};

	const sdkCode = useMemo(() => {
		if (!flag) return "";
		return `import { FeatureFlags } from '@flagix/sdk';

const flags = new FeatureFlags({ /* config */ });

// Check if flag is enabled
const isEnabled = await flags.isEnabled('${flag.key}', { default: false });

// Get a specific variation
const variation = await flags.getVariation('${flag.key}', { default: 'control' });
`;
	}, [flag]);

	if (isLoading) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-8 w-64 rounded-lg" />
				<Skeleton className="h-48 w-full rounded-lg" />
				<Skeleton className="h-32 w-full rounded-lg" />
			</div>
		);
	}

	if (isError || !flag) {
		return (
			<div className="space-y-6">
				<div className="flex items-center gap-3">
					<Button isIconOnly variant="ghost">
						<Link
							to="/projects/$projectId/flags"
							params={{ projectId }}
							className="flex items-center justify-center">
							<ArrowLeftIcon className="h-4 w-4" />
						</Link>
					</Button>
					<div className="flex-1">
						<h1 className="text-2xl font-bold text-foreground">
							Flag Not Found
						</h1>
						<p className="mt-1 text-sm">
							The feature flag you're looking for doesn't exist or has been
							deleted.
						</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-3">
				<Button isIconOnly variant="ghost">
					<Link
						to="/projects/$projectId/flags"
						params={{ projectId }}
						className="flex items-center justify-center">
						<ArrowLeftIcon className="h-4 w-4" />
					</Link>
				</Button>
				<div className="flex-1">
					<div className="flex items-center gap-3">
						<h1 className="text-2xl font-bold text-foreground">{flag.name}</h1>
						<Badge variant="soft">{flag.flagType}</Badge>
					</div>
					<div className="mt-1 flex items-center gap-2">
						<code className="text-sm">{flag.key}</code>
						<Tooltip>
							<Tooltip.Trigger>
								<Button
									isIconOnly
									variant="ghost"
									size="sm"
									onPress={handleCopyKey}>
									{copiedKey ? (
										<span className="text-xs text-success">Copied!</span>
									) : (
										<CopyIcon className="h-3 w-3" />
									)}
								</Button>
							</Tooltip.Trigger>
							<Tooltip.Content>Copy key</Tooltip.Content>
						</Tooltip>
					</div>
				</div>
				<Button
					variant="ghost"
					className="gap-2"
					onPress={() => setEditModalOpen(true)}>
					<PencilIcon className="h-4 w-4" />
					Edit
				</Button>
				<Button
					variant="ghost"
					className="gap-2 text-danger"
					onPress={handleDelete}>
					<TrashIcon className="h-4 w-4" />
					Delete
				</Button>
			</div>

			{/* Description */}
			{flag.description && (
				<div className="rounded-lg p-4">
					<p className="text-sm">{flag.description}</p>
				</div>
			)}

			{/* Info Grid */}
			<div className="grid grid-cols-3 gap-4">
				<div className="rounded-lg border p-4">
					<p className="text-xs font-medium">Version</p>
					<p className="mt-1 text-lg font-semibold text-foreground">
						v{flag.version}
					</p>
				</div>
				<div className="rounded-lg border p-4">
					<p className="text-xs font-medium">Type</p>
					<p className="mt-1 text-lg font-semibold text-foreground">
						{flag.flagType}
					</p>
				</div>
				<div className="rounded-lg border p-4">
					<p className="text-xs font-medium">Variations</p>
					<p className="mt-1 text-lg font-semibold text-foreground">
						{flag.variations?.length ?? 0}
					</p>
				</div>
			</div>

			{/* Variations Table */}
			<div>
				<h2 className="mb-3 text-lg font-semibold text-foreground">
					Variations
				</h2>
				{flag.variations && flag.variations.length > 0 ? (
					<Table aria-label="Variations">
						<TableHeader>
							<TableColumn>Key</TableColumn>
							<TableColumn>Value</TableColumn>
							<TableColumn>Description</TableColumn>
						</TableHeader>
						<TableBody items={flag.variations}>
							{(variation) => (
								<TableRow key={variation.id}>
									<TableCell>
										<code className="text-sm">{variation.key}</code>
									</TableCell>
									<TableCell>
										<Badge variant="soft">{getVariationValue(variation)}</Badge>
									</TableCell>
									<TableCell>
										<span className="text-sm">
											{variation.description || "—"}
										</span>
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				) : (
					<div className="rounded-lg border p-4 text-center">
						No variations defined
					</div>
				)}
			</div>

			{/* Targeting Rules */}
			<TargetingRules flagId={flag.id} variations={flag.variations ?? []} />

			{/* Environment States */}
			<div>
				<h2 className="mb-3 text-lg font-semibold text-foreground">
					Environment States
				</h2>
				{envStates.length > 0 ? (
					<div className="grid grid-cols-2 gap-3">
						{envStates.map((env) => (
							<div
								key={env.id}
								className="flex items-center justify-between rounded-lg border p-3">
								<div className="flex items-center gap-2">
									<span className="font-medium text-foreground">
										{env.name}
									</span>
									<Badge
										color={STATUS_BADGE_COLOR[env.status] ?? "default"}
										variant="soft">
										{env.status}
									</Badge>
								</div>
								<div className="flex items-center gap-2">
									{env.isEnabled ? (
										<Badge color="success" variant="soft">
											Enabled
										</Badge>
									) : (
										<Badge variant="soft">Disabled</Badge>
									)}
								</div>
							</div>
						))}
					</div>
				) : (
					<div className="rounded-lg border p-4 text-center">
						No environments configured
					</div>
				)}
			</div>

			{/* SDK Example */}
			<div>
				<h2 className="mb-3 text-lg font-semibold text-foreground">
					SDK Example
				</h2>
				<div className="relative rounded-lg p-4">
					<pre className="overflow-x-auto text-sm">
						<code>{sdkCode}</code>
					</pre>
				</div>
			</div>

			{/* Metadata */}
			<div className="text-xs">
				<p>Created: {new Date(flag.createdAt).toLocaleString()}</p>
				<p>Updated: {new Date(flag.updatedAt).toLocaleString()}</p>
			</div>

			{/* Edit Modal */}
			<FlagModal
				isOpen={editModalOpen}
				onClose={() => setEditModalOpen(false)}
				flag={{
					...flag,
					isEnabled: flag.states?.[0]?.isEnabled ?? false,
					status: flag.states?.[0]?.status ?? "draft",
					environmentId: flag.states?.[0]?.environmentId ?? "",
					stateId: flag.states?.[0]?.id ?? "",
					stateVersion: flag.states?.[0]?.version ?? 0,
				}}
			/>
		</div>
	);
}
