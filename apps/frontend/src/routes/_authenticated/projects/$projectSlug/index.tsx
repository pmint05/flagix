import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/projects/$projectSlug/")({
	component: RouteComponent,
	beforeLoad: ({ params }) => {
		throw redirect({
			to: "/projects/$projectSlug/flags",
			params: {
				projectSlug: params.projectSlug,
			},
			replace: true,
		});
	},
});

function RouteComponent() {
	return <div>Hello "/_authenticated/projects/$projectSlug/"!</div>;
}
