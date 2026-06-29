import { useParams } from "@tanstack/react-router";
import { useProjectBySlug } from "@/features/projects/api";

export function useCurrentProject() {
	const params = useParams({ strict: false });
	const projectSlug = (params as any).projectSlug as string | undefined;

	const { data: project } = useProjectBySlug(projectSlug);

	return project || null;
}
