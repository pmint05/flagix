import { createFileRoute, Outlet, Navigate, useParams } from "@tanstack/react-router";
import { useProjects, useProjectBySlug } from "@/features/projects/api";
import { Skeleton } from "@heroui/react";
import { useContextStore } from "@/stores";
import { useEffect } from "react";

export const Route = createFileRoute("/_authenticated/projects/$projectSlug")({
	component: ProjectSlugLayout,
});

function ProjectSlugLayout() {
	const params = useParams({ strict: false });
	const projectSlug = (params as any).projectSlug as string | undefined;

	const { data: project, isLoading: isProjectDetailLoading } = useProjectBySlug(projectSlug);
	const { selectedProject, setProject } = useContextStore();
	const { isPending, isLoading } = useProjects();

	useEffect(() => {
		if (project && project.id !== selectedProject?.id) {
			setProject(project);
		}
	}, [project, selectedProject?.id, setProject]);

	const isProjectLoading = isPending || isLoading || isProjectDetailLoading;

	if (isProjectLoading) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-8 w-64 rounded-lg" />
				<Skeleton className="h-125 w-full rounded-lg" />
			</div>
		);
	}

	if (!project) {
		return <Navigate to="/projects" replace />;
	}

	return <Outlet />;
}
