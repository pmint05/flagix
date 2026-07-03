import { createFileRoute } from "@tanstack/react-router";
import { ProjectLiveStream } from "@/features/analytics/components/ProjectLiveStream";

export const Route = createFileRoute("/_authenticated/live-events/")({
	component: RouteComponent,
	staticData: { hideEnvironmentSwitcher: true },
});

function RouteComponent() {
	return <ProjectLiveStream />;
}
