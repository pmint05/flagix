import { createFileRoute } from "@tanstack/react-router";
import { Button, Skeleton } from "@heroui/react";
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

export const Route = createFileRoute("/_authenticated/projects/")({
	component: ProjectsIndex,
});

function ProjectsIndex() {
	const { data, isLoading, isError } = useProjects();
	const deleteProject = useDeleteProject();

	const projects = data ?? [];

	const [modalOpen, setModalOpen] = useState(false);
	const [editingProject, setEditingProject] = useState<Project | undefined>();

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
				onDelete: (id) => deleteProject.mutate(id),
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
				<Button variant="primary" className="gap-2" onPress={handleCreate}>
					<PlusIcon className="h-4 w-4" />
					New Project
				</Button>
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
					actionLabel="New Project"
					onAction={handleCreate}
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
		</div>
	);
}
