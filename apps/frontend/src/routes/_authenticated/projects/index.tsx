import { createFileRoute, Link } from "@tanstack/react-router";
import { Button, Skeleton, Table, Tooltip } from "@heroui/react";
import {
	PencilSimpleIcon,
	PlusIcon,
	TrashSimpleIcon,
} from "@phosphor-icons/react";
import { useProjects, useDeleteProject } from "@/features/projects/api";
import { ProjectModal } from "@/features/projects/ProjectModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { useState } from "react";
import type { Project } from "@/types/project";
import CopyButton from "#/components/ui/copy-button";

export const Route = createFileRoute("/_authenticated/projects/")({
	component: ProjectsIndex,
});

function ProjectsIndex() {
	const [page, setPage] = useState(1);
	const pageSize = 10;

	const { data, isLoading, isError } = useProjects();
	const deleteProject = useDeleteProject();

	const projects = data ?? [];
	const total = data?.length ?? 0;
	const totalPages = Math.ceil(total / pageSize);

	const [modalOpen, setModalOpen] = useState(false);
	const [editingProject, setEditingProject] = useState<Project | undefined>();

	const handleCreate = () => {
		setEditingProject(undefined);
		setModalOpen(true);
	};

	const handleEdit = (project: Project) => {
		setEditingProject(project);
		setModalOpen(true);
	};

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
				<>
					<Table aria-label="Projects list">
						<Table.ScrollContainer>
							<Table.Content>
								<Table.Header>
									<Table.Column>Name</Table.Column>
									<Table.Column>Slug</Table.Column>
									<Table.Column>Description</Table.Column>
									<Table.Column>Flags</Table.Column>
									<Table.Column>Actions</Table.Column>
								</Table.Header>
								<Table.Body items={projects}>
									{(project: Project) => (
										<Table.Row key={project.id}>
											<Table.Cell>
												<Link
													className="font-medium hover:underline hover:text-accent transition"
													to={`/projects/$projectSlug/flags`}
													params={{ projectSlug: project.slug }}>
													{project.name}
												</Link>
											</Table.Cell>
											<Table.Cell>
												<div className="flex items-center gap-2 group">
													<span>{project.slug}</span>
													<CopyButton
														text={project.slug}
														buttonProps={{
															isIconOnly: true,
															className:
																"size-8 group-hover:opacity-100 opacity-0 transition-opacity",
														}}
													/>
												</div>
											</Table.Cell>
											<Table.Cell>
												<span>{project.description || "—"}</span>
											</Table.Cell>
											<Table.Cell>
												<span>{project.flagCount ?? 0}</span>
											</Table.Cell>
											<Table.Cell>
												<div className="flex items-center gap-1">
													<Tooltip>
														<Tooltip.Trigger>
															<Button
																isIconOnly
																variant="ghost"
																size="sm"
																onPress={() => handleEdit(project)}>
																<PencilSimpleIcon className="h-4 w-4" />
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
																className="hover:text-danger hover:bg-danger-soft transition"
																onPress={() =>
																	deleteProject.mutate(project.id)
																}>
																<TrashSimpleIcon className="h-4 w-4" />
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

					{totalPages > 1 && (
						<div className="flex items-center justify-center gap-2">
							<Button
								variant="outline"
								isDisabled={page === 1}
								onPress={() => setPage(page - 1)}>
								Previous
							</Button>
							<span className="text-sm">
								Page {page} of {totalPages}
							</span>
							<Button
								variant="outline"
								isDisabled={page === totalPages}
								onPress={() => setPage(page + 1)}>
								Next
							</Button>
						</div>
					)}
				</>
			)}

			<ProjectModal
				isOpen={modalOpen}
				onClose={() => setModalOpen(false)}
				project={editingProject}
			/>
		</div>
	);
}
