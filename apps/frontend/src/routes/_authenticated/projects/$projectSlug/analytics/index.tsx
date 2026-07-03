import { createFileRoute } from "@tanstack/react-router";
import { ProjectAnalyticsOverview } from "@/features/analytics/components/ProjectAnalyticsOverview";

export const Route = createFileRoute(
	"/_authenticated/projects/$projectSlug/analytics/",
)({
	component: RouteComponent,
	staticData: { hideEnvironmentSwitcher: false },
});

function RouteComponent() {
	return <ProjectAnalyticsOverview />;
}
