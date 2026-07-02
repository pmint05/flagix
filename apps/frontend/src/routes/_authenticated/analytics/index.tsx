import { createFileRoute } from "@tanstack/react-router";
import { AnalyticsOverview } from "@/features/analytics/components/AnalyticsOverview";

export const Route = createFileRoute("/_authenticated/analytics/")({
	component: AnalyticsPage,
	staticData: {
		hideEnvironmentSwitcher: true,
	},
});

function AnalyticsPage() {
	return <AnalyticsOverview />;
}
