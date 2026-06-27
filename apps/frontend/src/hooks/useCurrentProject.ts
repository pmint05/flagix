import { useParams } from "@tanstack/react-router";
import { useProjects } from "@/features/projects/api";

export function useCurrentProject() {
	const params = useParams({ strict: false });
	const projectSlug = (params as any).projectSlug as string | undefined;

	const { data: projects } = useProjects();

	if (!projectSlug || !projects) return null;
	return projects.find((p) => p.slug === projectSlug) || null;
}
