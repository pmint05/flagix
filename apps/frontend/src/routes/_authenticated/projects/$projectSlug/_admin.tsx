import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useContextStore, useIsHydrated } from "@/stores";
import { useEffect } from "react";

export const Route = createFileRoute(
	"/_authenticated/projects/$projectSlug/_admin",
)({
	component: AdminLayout,
});

function AdminLayout() {
	const { projectSlug } = Route.useParams();
	const navigate = useNavigate();
	const isHydrated = useIsHydrated();
	const selectedOrganization = useContextStore((s) => s.selectedOrganization);
	const role = selectedOrganization?.role;

	useEffect(() => {
		if (!isHydrated) return;

		if (!role || role === "viewer") {
			void navigate({
				to: "/projects/$projectSlug/flags",
				params: { projectSlug },
				replace: true,
			});
		}
	}, [isHydrated, role, navigate, projectSlug]);

	// Prevent rendering children until hydrated to avoid flashing content
	if (!isHydrated) {
		return null;
	}

	// Prevent rendering children if viewer to avoid flashing unauthorized content
	if (!role || role === "viewer") {
		return null;
	}

	return <Outlet />;
}
