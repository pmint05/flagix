import { createFileRoute, Link } from "@tanstack/react-router";
import {
	Badge,
	Button,
	Skeleton,
	Switch,
	Table,
	TableBody,
	TableColumn,
	TableHeader,
	TableRow,
	TableCell,
	Tooltip,
} from "@heroui/react";
import {
	ArrowLeft,
	Pencil,
	Plus,
	Trash,
	ArrowCounterClockwise,
} from "@phosphor-icons/react";
import {
	useEnvironments,
	useDeleteEnvironment,
} from "@/features/environments/api";
import { EnvironmentModal } from "@/features/environments/EnvironmentModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { useState } from "react";
import type { Environment } from "@/types/environment";

export const Route = createFileRoute(
	"/_authenticated/projects/$projectId/environments",
)({
	component: EnvironmentsIndex,
});

const TYPE_BADGE_COLOR: Record<
	string,
	"success" | "warning" | "danger" | "default"
> = {
	development: "success",
	staging: "warning",
	production: "danger",
	custom: "default",
};

function EnvironmentsIndex() {
	const { data: environments, isLoading, isError } = useEnvironments();
	const deleteEnvironment = useDeleteEnvironment();

	const [modalOpen, setModalOpen] = useState(false);
	const [editingEnv, setEditingEnv] = useState<Environment | undefined>();

	const handleCreate = () => {
		setEditingEnv(undefined);
		setModalOpen(true);
	};

	const handleEdit = (env: Environment) => {
		setEditingEnv(env);
		setModalOpen(true);
	};

	const handleToggleActive = (env: Environment) => {
		if (env.isActive) {
			deleteEnvironment.mutate(env.id);
		} else {
			deleteEnvironment.mutate(env.id);
		}
	};

	const envs = environments ?? [];

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<Button isIconOnly variant="ghost">
					<Link to="/projects" className="flex items-center justify-center">
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				<div className="flex-1">
					<h1 className="text-2xl font-bold text-foreground">Environments</h1>
					<p className="mt-1 text-sm">
						Manage deployment environments for this project
					</p>
				</div>
				<Button variant="primary" className="gap-2" onPress={handleCreate}>
					<Plus className="h-4 w-4" />
					New Environment
				</Button>
			</div>

			{isLoading ? (
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
					description="Create your first environment to start managing feature flags per deployment target."
					actionLabel="New Environment"
					onAction={handleCreate}
				/>
			) : (
				<Table aria-label="Environments list">
					<TableHeader>
						<TableColumn>Name</TableColumn>
						<TableColumn>Type</TableColumn>
						<TableColumn>Description</TableColumn>
						<TableColumn>Active</TableColumn>
						<TableColumn>Actions</TableColumn>
					</TableHeader>
					<TableBody items={envs}>
						{(env) => (
							<TableRow key={env.id}>
								<TableCell>
									<span className="font-medium text-foreground">
										{env.name}
									</span>
								</TableCell>
								<TableCell>
									<Badge
										color={TYPE_BADGE_COLOR[env.type] ?? "default"}
										variant="soft">
										{env.type}
									</Badge>
								</TableCell>
								<TableCell>
									<span>{env.description || "—"}</span>
								</TableCell>
								<TableCell>
									<Switch
										isSelected={env.isActive}
										onChange={() => handleToggleActive(env)}
										size="sm"
									/>
								</TableCell>
								<TableCell>
									<div className="flex items-center gap-1">
										<Tooltip>
											<Tooltip.Trigger>
												<Button
													isIconOnly
													variant="ghost"
													size="sm"
													onPress={() => handleEdit(env)}>
													<Pencil className="h-4 w-4" />
												</Button>
											</Tooltip.Trigger>
											<Tooltip.Content>Edit</Tooltip.Content>
										</Tooltip>
										<Tooltip>
											<Tooltip.Trigger>
												<Button
													isIconOnly
													variant="ghost"
													size="sm"
													className="text-danger"
													onPress={() => handleToggleActive(env)}>
													{env.isActive ? (
														<Trash className="h-4 w-4" />
													) : (
														<ArrowCounterClockwise className="h-4 w-4" />
													)}
												</Button>
											</Tooltip.Trigger>
											<Tooltip.Content>
												{env.isActive ? "Deactivate" : "Restore"}
											</Tooltip.Content>
										</Tooltip>
									</div>
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			)}

			<EnvironmentModal
				isOpen={modalOpen}
				onClose={() => setModalOpen(false)}
				environment={editingEnv}
			/>
		</div>
	);
}
