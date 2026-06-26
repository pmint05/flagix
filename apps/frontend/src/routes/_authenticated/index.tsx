import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/")({
	component: DashboardIndex,
});

function DashboardIndex() {
	return (
		<div>
			<h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
			<p className="mt-2">
				Welcome to Flagix. Select a project from the sidebar to get started.
			</p>
		</div>
	);
}
