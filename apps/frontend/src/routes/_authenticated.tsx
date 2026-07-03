import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import {
	useAuthStore,
	useSidebarStore,
	useContextStore,
	useIsHydrated,
	useUIStore,
} from "@/stores";
import { cn, Skeleton } from "@heroui/react";
import { ProjectSettingsModal } from "@/features/projects/ProjectSettingsModal";
import { OrgSettingsModal } from "@/features/organizations/OrgSettingsModal";
import {
	Sidebar,
	SidebarResizeHandle,
	MobileSidebarDrawer,
} from "@/components/sidebar";
import { Header } from "@/components/header";
import {
	SIDEBAR_WIDTH_DEFAULT,
	SIDEBAR_WIDTH_COLLAPSED,
	SIDEBAR_WIDTH_MIN,
	SIDEBAR_WIDTH_MAX,
	SIDEBAR_SNAP_THRESHOLD,
} from "@/constants/sidebar";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { Panel, Group as PanelGroup } from "react-resizable-panels";
import type { PanelImperativeHandle } from "react-resizable-panels";
import { useRef, useEffect } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { useProjects } from "@/features/projects/api";

const getAuthSession = createServerFn({ method: "GET" }).handler(async () => {
	const headers = getRequestHeaders();

	const session = await authClient.getSession({
		fetchOptions: {
			headers: headers as any,
		},
	});

	return session;
});

const authSessionQueryOptions = () => ({
	queryKey: ["auth-session"],
	queryFn: () => getAuthSession(),
	staleTime: 1000 * 60 * 5,
});

export const Route = createFileRoute("/_authenticated")({
	component: AuthenticatedLayout,
	beforeLoad: async ({ context }) => {
		const session = await context.queryClient.ensureQueryData(
			authSessionQueryOptions(),
		);

		if (!session.data?.session) {
			throw redirect({ to: "/login" });
		}

		useAuthStore.getState().setSession(session.data.session as any, session.data.user as any);
	},
});

function AuthenticatedLayout() {
	const isHydrated = useIsHydrated();
	const isMobile = useIsMobile();
	const selectedOrganization = useContextStore((s) => s.selectedOrganization);
	const { isCollapsed, size, setCollapsed, setSize } = useSidebarStore();
	const isProjectSettingsOpen = useUIStore((s) => s.isProjectSettingsOpen);
	const isOrgSettingsOpen = useUIStore((s) => s.isOrgSettingsOpen);
	const closeProjectSettings = useUIStore((s) => s.closeProjectSettings);
	const closeOrgSettings = useUIStore((s) => s.closeOrgSettings);
	const panelRef = useRef<PanelImperativeHandle>(null);
	const navigate = useNavigate();
	const location = useLocation();

	const { data: projects, isLoading: isProjectsLoading } = useProjects();

	// Check org selection & project existence - redirect if needed (after hydration)
	useEffect(() => {
		if (!isHydrated) return;
		if (!selectedOrganization) {
			void navigate({ to: "/orgSelect", replace: true });
			return;
		}

		if (isProjectsLoading) return;

		const isAtProjectsPage = location.pathname === "/projects" || location.pathname === "/projects/";
		if (projects && projects.length === 0 && !isAtProjectsPage) {
			void navigate({ to: "/projects", replace: true });
		}
	}, [isHydrated, selectedOrganization, projects, isProjectsLoading, location.pathname, navigate]);

	// Sync imperative panel API when toggle buttons are clicked
	useEffect(() => {
		const panel = panelRef.current;
		if (!panel) return;

		// if store is collapsed but panel is not, collapse it
		if (isCollapsed && !panel.isCollapsed()) {
			panel.collapse();
		}
		// if store is expanded but panel is collapsed, expand it to saved size
		else if (!isCollapsed && panel.isCollapsed()) {
			panel.resize(size || SIDEBAR_WIDTH_DEFAULT);
		}
	}, [isCollapsed, size]);

	if (!isHydrated) {
		return (
			<div className="h-screen w-full bg-background dark:bg-background-tertiary overflow-hidden flex">
				<div
					className={cn(
						"shrink-0 border-r h-full w-62.5 p-2 sm:flex flex-col gap-4 hidden",
						{
							"w-14": isCollapsed,
						},
					)}>
					<Skeleton className="h-10 w-full rounded-md" />
					<div className="mt-4 flex flex-col gap-3">
						<Skeleton
							className={cn("h-8 w-3/4 rounded-md", {
								"w-full": isCollapsed && !size,
							})}
						/>
						<Skeleton className={cn("h-8 w-full rounded-md")} />
						<Skeleton
							className={cn("h-8 w-5/6 rounded-md", {
								"w-full": isCollapsed && !size,
							})}
						/>
					</div>
					<div className="mt-auto">
						<Skeleton className="h-10 w-full rounded-md" />
					</div>
				</div>
				<div className="flex-1 flex flex-col">
					<div className="h-14 border-b flex items-center px-4 gap-4">
						<Skeleton className="h-8 w-8 rounded-md" />
						<Skeleton className="h-6 w-32 rounded-md" />
						<Skeleton className="h-8 sm:w-48 w-36 rounded-md ml-auto" />
					</div>
					<div className="flex-1 p-6">
						<Skeleton className="h-10 w-1/3 rounded-md mb-6" />
						<Skeleton className="h-100 w-full rounded-md" />
					</div>
				</div>
			</div>
		);
	}

	// Mobile layout: no PanelGroup, sidebar in Drawer
	if (isMobile) {
		return (
			<div className="h-screen w-full bg-background dark:bg-background-tertiary overflow-hidden flex flex-col">
				<Header />
				<main className="flex-1 overflow-auto">
					<div className="h-full p-4 bg-surface dark:bg-background-secondary overflow-auto border">
						<Outlet />
					</div>
				</main>
				<MobileSidebarDrawer />

				<ProjectSettingsModal
					isOpen={isProjectSettingsOpen}
					onClose={closeProjectSettings}
				/>
				<OrgSettingsModal
					isOpen={isOrgSettingsOpen}
					onClose={closeOrgSettings}
				/>
			</div>
		);
	}

	// Desktop layout: PanelGroup with resizable sidebar
	return (
		<div className="h-screen w-full bg-background dark:bg-background-tertiary overflow-hidden">
			<PanelGroup orientation="horizontal">
				<Panel
					panelRef={panelRef}
					defaultSize={
						isCollapsed
							? SIDEBAR_WIDTH_COLLAPSED
							: size || SIDEBAR_WIDTH_DEFAULT
					}
					minSize={SIDEBAR_WIDTH_MIN}
					maxSize={SIDEBAR_WIDTH_MAX}
					collapsible={true}
					collapsedSize={SIDEBAR_WIDTH_COLLAPSED}
					groupResizeBehavior="preserve-pixel-size"
					onResize={(newSize) => {
						// Extract pixel value from newSize which can be a number or an object in v4
						const px = typeof newSize === "number" ? newSize : newSize.inPixels;

						if (px < SIDEBAR_SNAP_THRESHOLD) {
							if (!isCollapsed) setCollapsed(true);
						} else {
							if (isCollapsed) setCollapsed(false);
							// Save expanded size if it's within normal bounds
							if (px >= SIDEBAR_WIDTH_MIN) {
								setSize(px);
							}
						}
					}}
					className="flex flex-col transition-[width] duration-300 ease-in-out">
					<Sidebar />
				</Panel>

				<SidebarResizeHandle />

				<Panel
					minSize={50}
					className="flex flex-col bg-background dark:bg-background-tertiary">
					<Header />
					<main className="flex-1 overflow-auto">
						<div className="h-full p-6 bg-surface dark:bg-background-secondary rounded-tl-3xl overflow-auto border">
							<Outlet />
						</div>
					</main>
				</Panel>
			</PanelGroup>

			<ProjectSettingsModal
				isOpen={isProjectSettingsOpen}
				onClose={closeProjectSettings}
			/>
			<OrgSettingsModal
				isOpen={isOrgSettingsOpen}
				onClose={closeOrgSettings}
			/>
		</div>
	);
}
