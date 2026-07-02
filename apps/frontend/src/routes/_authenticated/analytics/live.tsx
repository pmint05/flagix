import { createFileRoute } from "@tanstack/react-router";
import { LiveStream } from "@/features/analytics/components/LiveStream";

export const Route = createFileRoute("/_authenticated/analytics/live")({
	component: LiveStreamPage,
	staticData: { hideEnvironmentSwitcher: false },
});

function LiveStreamPage() {
	return <LiveStream />;
}
