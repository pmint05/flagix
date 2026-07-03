import { createFileRoute } from "@tanstack/react-router";
import { Button, Skeleton, toast } from "@heroui/react";
import { PlusIcon } from "@phosphor-icons/react";
import { useProjects, useDeleteProject } from "@/features/projects/api";
import { ProjectModal } from "@/features/projects/ProjectModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { useState, useMemo } from "react";
import type { Project } from "@/types/project";
import { createProjectColumns } from "@/features/projects/columns";
import { DataTable } from "@/components/ui/data-table/DataTable";
import { useDataTableUrlSync } from "@/hooks/useDataTableUrlSync";
import type { ColumnDef } from "@tanstack/react-table";
import { ConfirmModal } from "@/components/ui/confirm-modal";

import { PermissionGuard } from "@/components/permission/PermissionGuard";
import { useCanCreateProject } from "@/hooks/usePermission";

export const Route = createFileRoute("/_authenticated/projects/")({
	component: ProjectsIndex,
	staticData: {
		hideEnvironmentSwitcher: true,
	}
});

function ProjectsIndex() {
	const { data, isLoading, isError } = useProjects();
	const deleteProject = useDeleteProject();
	const canCreate = useCanCreateProject();

	const projects = data ?? [];

	const [modalOpen, setModalOpen] = useState(false);
	const [editingProject, setEditingProject] = useState<Project | undefined>();
	const [deletingProject, setDeletingProject] = useState<Project | null>(null);
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

	const { tableState, updateTableState } = useDataTableUrlSync({
		defaultPageSize: 10,
	});

	const handleCreate = () => {
		setEditingProject(undefined);
		setModalOpen(true);
	};

	const handleEdit = (project: Project) => {
		setEditingProject(project);
		setModalOpen(true);
	};

	const columns = useMemo(
		() =>
			createProjectColumns({
				onEdit: handleEdit,
				onDelete: (project) => {
					setDeletingProject(project);
					setDeleteConfirmOpen(true);
				},
			}) as ColumnDef<Project, unknown>[],
		[],
	);

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-foreground">Projects</h1>
					<p className="mt-1 text-sm">Manage your feature flag projects</p>
				</div>
				<PermissionGuard permission="project:create">
					<Button variant="primary" className="gap-2" onPress={handleCreate}>
						<PlusIcon className="h-4 w-4" />
						New Project
					</Button>
				</PermissionGuard>
			</div>

			{isLoading ? (
				<div className="space-y-3">
					{Array.from({ length: 5 }).map((_, i) => (
						<Skeleton key={i} className="h-12 w-full rounded-lg" />
					))}
				</div>
			) : isError ? (
				<div className="rounded-lg border border-danger-200 bg-danger-50 p-4 text-danger">
					Failed to load projects. Please try again.
				</div>
			) : projects.length === 0 ? (
				<EmptyState
					title="No projects yet"
					description="Create your first project to start managing feature flags."
					actionLabel={canCreate ? "New Project" : undefined}
					onAction={canCreate ? handleCreate : undefined}
				/>
			) : (
				<DataTable
					data={projects}
					columns={columns}
					state={tableState}
					onStateChange={updateTableState}
					rowCount={projects.length}
				/>
			)}

			<ProjectModal
				isOpen={modalOpen}
				onClose={() => setModalOpen(false)}
				project={editingProject}
			/>

			<ConfirmModal
				isOpen={deleteConfirmOpen}
				onOpenChange={setDeleteConfirmOpen}
				title="Delete Project"
				description={
					deletingProject ? (
						<span>
							Are you sure you want to delete project{" "}
							<strong className="text-foreground">{deletingProject.name}</strong>?
							This action is permanent and will delete all associated environments,
							feature flags, SDK keys, and history.
						</span>
					) : null
				}
				variant="danger"
				confirmText="Delete Project"
				cancelText="Cancel"
				requireRetypeContent={deletingProject?.slug}
				retypeLabel="Retype project slug to confirm"
				onConfirm={async () => {
					if (deletingProject) {
						try {
							await deleteProject.mutateAsync(deletingProject.id);
							toast.success("Project deleted successfully");
						} catch (error: any) {
							toast.danger(error?.message || "Failed to delete project");
						}
					}
				}}
			/>
		</div>
	);
}
