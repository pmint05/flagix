import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
	Popover,
	PopoverTrigger,
	PopoverContent,
	Button,
	Separator,
	cn,
} from "@heroui/react";
import {
	GearIcon,
	UserPlusIcon,
	PlusIcon,
	FolderOpenIcon,
} from "@phosphor-icons/react";
import { useContextStore } from "#/stores";
import { useOrganizations } from "#/features/organizations/api";
import { useProjects } from "#/features/projects/api";
import { useNavigate, Link } from "@tanstack/react-router";
import { EntityList } from "./EntityList";
import { useIsMobile } from "#/hooks/useIsMobile";
import { OrganizationModal } from "#/features/organizations/OrganizationModal";
import { ProjectModal } from "#/features/projects/ProjectModal";

interface OrgProjectSwitcherProps {
	children: React.ReactNode;
}

const HOVER_DELAY = 120;

function EntitiesGroup({
	orgs,
	orgsLoading,
	projects,
	projectsLoading,
	selectedOrganization,
	selectedProject,
	setOrganization,
	setProject,
	setEnvironment,
	setMainOpen,
	setIsOrgModalOpen,
	setIsProjectModalOpen,
}: any) {
	// Search states
	const [orgSearch, setOrgSearch] = useState("");
	const [prjSearch, setPrjSearch] = useState("");

	// Hover states for sub-menus
	const [orgMenuOpen, setOrgMenuOpen] = useState(false);
	const [prjMenuOpen, setPrjMenuOpen] = useState(false);

	// Timer refs for hover debounce
	const orgEnterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const orgLeaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const prjEnterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const prjLeaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Track if mouse has actually entered the submenu (vs just hovering the trigger)
	const orgEntered = useRef(false);
	const prjEntered = useRef(false);

	const orgSearchRef = useRef<HTMLInputElement>(null);
	const prjSearchRef = useRef<HTMLInputElement>(null);

	const isMobile = useIsMobile();
	const navigate = useNavigate();

	// Cleanup timers on unmount
	useEffect(() => {
		return () => {
			if (orgEnterTimer.current) clearTimeout(orgEnterTimer.current);
			if (orgLeaveTimer.current) clearTimeout(orgLeaveTimer.current);
			if (prjEnterTimer.current) clearTimeout(prjEnterTimer.current);
			if (prjLeaveTimer.current) clearTimeout(prjLeaveTimer.current);
		};
	}, []);

	// Auto-focus search input when sub-menu opens
	useEffect(() => {
		if (orgMenuOpen && orgSearchRef.current) {
			const timer = setTimeout(() => {
				orgSearchRef.current?.focus({ preventScroll: true });
			}, 50);
			return () => clearTimeout(timer);
		}
	}, [orgMenuOpen]);

	useEffect(() => {
		if (prjMenuOpen && prjSearchRef.current) {
			const timer = setTimeout(() => {
				prjSearchRef.current?.focus({ preventScroll: true });
			}, 50);
			return () => clearTimeout(timer);
		}
	}, [prjMenuOpen]);

	const handleOrgSelect = (org: any) => {
		if (selectedOrganization?.id !== org.id) {
			setOrganization(org);
			setProject(null);
			setEnvironment(null);
		}
		setMainOpen(false);
		setOrgMenuOpen(false);
	};

	const handleProjectSelect = (project: any) => {
		if (selectedProject?.id !== project.id) {
			setProject(project);
			setEnvironment(null);
			navigate({
				to: "/projects/$projectSlug/environments",
				params: { projectSlug: project.slug },
			});
		}
		setMainOpen(false);
		setPrjMenuOpen(false);
	};

	// ── Org hover handlers ──────────────────────────────────────────────
	const handleOrgTriggerEnter = useCallback(() => {
		if (isMobile) return;
		if (orgLeaveTimer.current) {
			clearTimeout(orgLeaveTimer.current);
			orgLeaveTimer.current = null;
		}
		setPrjMenuOpen(false);
		prjEntered.current = false;

		orgEnterTimer.current = setTimeout(() => {
			setOrgMenuOpen(true);
		}, HOVER_DELAY);
	}, [isMobile]);

	const handleOrgTriggerLeave = useCallback(() => {
		if (isMobile) return;
		if (orgEnterTimer.current) {
			clearTimeout(orgEnterTimer.current);
			orgEnterTimer.current = null;
		}
		if (!orgEntered.current) {
			orgLeaveTimer.current = setTimeout(() => {
				setOrgMenuOpen(false);
			}, HOVER_DELAY);
		}
	}, [isMobile]);

	const handleOrgMenuEnter = useCallback(() => {
		if (isMobile) return;
		if (orgLeaveTimer.current) {
			clearTimeout(orgLeaveTimer.current);
			orgLeaveTimer.current = null;
		}
		orgEntered.current = true;
	}, [isMobile]);

	const handleOrgMenuLeave = useCallback(() => {
		if (isMobile) return;
		orgEntered.current = false;
		setOrgMenuOpen(false);
	}, [isMobile]);

	const handleOrgTriggerClick = useCallback(() => {
		setPrjMenuOpen(false);
		setOrgMenuOpen((prev) => !prev);
	}, []);

	// ── Project hover handlers ──────────────────────────────────────────
	const handlePrjTriggerEnter = useCallback(() => {
		if (isMobile) return;
		if (prjLeaveTimer.current) {
			clearTimeout(prjLeaveTimer.current);
			prjLeaveTimer.current = null;
		}
		setOrgMenuOpen(false);
		orgEntered.current = false;

		prjEnterTimer.current = setTimeout(() => {
			setPrjMenuOpen(true);
		}, HOVER_DELAY);
	}, [isMobile]);

	const handlePrjTriggerLeave = useCallback(() => {
		if (isMobile) return;
		if (prjEnterTimer.current) {
			clearTimeout(prjEnterTimer.current);
			prjEnterTimer.current = null;
		}
		if (!prjEntered.current) {
			prjLeaveTimer.current = setTimeout(() => {
				setPrjMenuOpen(false);
			}, HOVER_DELAY);
		}
	}, [isMobile]);

	const handlePrjMenuEnter = useCallback(() => {
		if (isMobile) return;
		if (prjLeaveTimer.current) {
			clearTimeout(prjLeaveTimer.current);
			prjLeaveTimer.current = null;
		}
		prjEntered.current = true;
	}, [isMobile]);

	const handlePrjMenuLeave = useCallback(() => {
		if (isMobile) return;
		prjEntered.current = false;
		setPrjMenuOpen(false);
	}, [isMobile]);

	const handlePrjTriggerClick = useCallback(() => {
		setOrgMenuOpen(false);
		setPrjMenuOpen((prev) => !prev);
	}, []);

	return (
		<>
			{/* ═══════════════════ ORGANIZATION GROUP ═══════════════════ */}
			<EntityList
				label="Organization"
				items={orgs}
				isLoading={orgsLoading}
				selectedItem={selectedOrganization}
				searchValue={orgSearch}
				onSearchChange={setOrgSearch}
				onSelect={handleOrgSelect}
				menuOpen={orgMenuOpen}
				onTriggerEnter={handleOrgTriggerEnter}
				onTriggerLeave={handleOrgTriggerLeave}
				onMenuEnter={handleOrgMenuEnter}
				onMenuLeave={handleOrgMenuLeave}
				onTriggerClick={handleOrgTriggerClick}
				searchRef={orgSearchRef}
				subMenuMargin="-ml-1"
				subMenuBorder="border"
				bottomContent={
					<Button
						variant="ghost"
						size="sm"
						className="w-full justify-start"
						onPress={() => {
							setIsOrgModalOpen(true);
							setMainOpen(false);
						}}>
						<PlusIcon size={14} />
						Create new organization
					</Button>
				}
			/>

			{/* Org actions */}
			<div className="flex flex-col gap-0.5 px-1 pb-1">
				<Button
					fullWidth
					variant="ghost"
					size="sm"
					className="justify-start h-8">
					<GearIcon size={16} />
					Settings
				</Button>
				<Button
					fullWidth
					variant="ghost"
					size="sm"
					className="justify-start h-8">
					<UserPlusIcon size={16} />
					Invite members
				</Button>
			</div>

			<Separator className="my-1" />

			{/* ═══════════════════ PROJECT GROUP ═══════════════════════ */}
			<EntityList
				label="Project"
				items={projects}
				isLoading={projectsLoading}
				selectedItem={selectedProject}
				searchValue={prjSearch}
				onSearchChange={setPrjSearch}
				onSelect={handleProjectSelect}
				menuOpen={prjMenuOpen}
				onTriggerEnter={handlePrjTriggerEnter}
				onTriggerLeave={handlePrjTriggerLeave}
				onMenuEnter={handlePrjMenuEnter}
				onMenuLeave={handlePrjMenuLeave}
				onTriggerClick={handlePrjTriggerClick}
				searchRef={prjSearchRef}
				showDescription
				subMenuMargin="-ml-1"
				subMenuBorder="border"
				bottomContent={
					<div className="flex flex-col gap-0.5">
						<Button
							variant="ghost"
							size="sm"
							className="w-full justify-start"
							onPress={() => {
								setIsProjectModalOpen(true);
								setMainOpen(false);
							}}>
							<PlusIcon size={14} />
							Create new project
						</Button>
					</div>
				}
			/>

			{/* Project actions */}
			<div className="flex flex-col gap-0.5 px-1 pb-1">
				<Button
					fullWidth
					variant="ghost"
					size="sm"
					className="justify-start h-8">
					<GearIcon size={16} />
					Settings
				</Button>
				<Button
					variant="ghost"
					size="sm"
					className="w-full justify-start"
					render={(props) => (
						<Link
							to="/projects"
							className={props.className}
							onClick={() => setMainOpen(false)}>
							<FolderOpenIcon size={14} />
							All projects
						</Link>
					)}></Button>
			</div>
		</>
	);
}

export function OrgProjectSwitcher({ children }: OrgProjectSwitcherProps) {
	const {
		selectedOrganization,
		selectedProject,
		setOrganization,
		setProject,
		setEnvironment,
	} = useContextStore();

	const { data: orgs, isLoading: orgsLoading } = useOrganizations();
	const { data: projects, isLoading: projectsLoading } = useProjects();

	const navigate = useNavigate();
	const prevOrgIdRef = useRef<string | undefined>(selectedOrganization?.id);
	const isInitialMount = useRef(true);

	// Auto-select first project (or redirect to /projects) when org changes
	useEffect(() => {
		if (isInitialMount.current) {
			return;
		}

		const orgId = selectedOrganization?.id;
		if (!orgId) return;
		if (orgId === prevOrgIdRef.current) return;
		prevOrgIdRef.current = orgId;

		// Org changed — clear current project, wait for projects to load
		setProject(null);
		setEnvironment(null);
	}, [selectedOrganization?.id, setProject, setEnvironment]);

	useEffect(() => {
		if (isInitialMount.current) {
			if (!projectsLoading) {
				isInitialMount.current = false;
			}
			return;
		}

		const orgId = selectedOrganization?.id;
		if (!orgId) return;
		if (orgId !== prevOrgIdRef.current) return;
		if (projectsLoading) return;

		if (projects && projects.length > 0) {
			setProject(projects[0]);
			navigate({
				to: "/projects/$projectSlug/environments",
				params: { projectSlug: projects[0].slug },
			});
		} else {
			navigate({ to: "/projects" });
		}
	}, [
		selectedOrganization?.id,
		projects,
		projectsLoading,
		setProject,
		navigate,
	]);

	const [mainOpen, setMainOpen] = useState(false);
	const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
	const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

	const isMobile = useIsMobile();

	return (
		<>
			<Popover isOpen={mainOpen} onOpenChange={setMainOpen}>
				<PopoverTrigger className="w-full data-[pressed=true]:scale-100 active:scale-100">
					{children}
				</PopoverTrigger>
				<PopoverContent
					placement={isMobile ? "bottom start" : "right top"}
					offset={isMobile ? 8 : 16}
					className="w-64 p-0 overflow-visible">
					<Popover.Dialog className="overflow-visible p-0">
						<div className="flex w-full flex-col p-1 gap-1 overflow-visible">
							<EntitiesGroup
								orgs={orgs}
								orgsLoading={orgsLoading}
								projects={projects}
								projectsLoading={projectsLoading}
								selectedOrganization={selectedOrganization}
								selectedProject={selectedProject}
								setOrganization={setOrganization}
								setProject={setProject}
								setEnvironment={setEnvironment}
								setMainOpen={setMainOpen}
								setIsOrgModalOpen={setIsOrgModalOpen}
								setIsProjectModalOpen={setIsProjectModalOpen}
							/>
						</div>
					</Popover.Dialog>
				</PopoverContent>
			</Popover>

			<OrganizationModal
				isOpen={isOrgModalOpen}
				onClose={() => setIsOrgModalOpen(false)}
			/>
			<ProjectModal
				isOpen={isProjectModalOpen}
				onClose={() => setIsProjectModalOpen(false)}
			/>
		</>
	);
}
