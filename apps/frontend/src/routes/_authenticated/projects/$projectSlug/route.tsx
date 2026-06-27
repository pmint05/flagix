import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import { useCurrentProject } from "@/hooks/useCurrentProject";
import { useProjects } from "@/features/projects/api";
import { Skeleton } from "@heroui/react";

export const Route = createFileRoute("/_authenticated/projects/$projectSlug")({
	component: ProjectSlugLayout,
});

function ProjectSlugLayout() {
	const project = useCurrentProject();
	const { isPending, isLoading } = useProjects();

	const isProjectLoading = isPending || isLoading;

	if (isProjectLoading) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-8 w-1/3 rounded-lg" />
				<Skeleton className="h-64 w-full rounded-lg" />
			</div>
		);
	}

	if (!project) {
		return <Navigate to="/projects" replace />;
	}

	return <Outlet />;
}
