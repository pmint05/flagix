import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
	Popover,
	PopoverTrigger,
	PopoverContent,
	Button,
	Separator,
	cn,
} from "@heroui/react";
import { GearIcon, UserPlusIcon } from "@phosphor-icons/react";
import { useContextStore } from "#/stores";
import { useOrganizations } from "#/features/organizations/api";
import { useProjects } from "#/features/projects/api";
import { useNavigate } from "@tanstack/react-router";
import { EntityList } from "./EntityList";

interface OrgProjectSwitcherProps {
	children: React.ReactNode;
}

const HOVER_DELAY = 120;

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
	const prevOrgIdRef = useRef<string | undefined>(undefined);

	// Auto-select first project (or redirect to /projects) when org changes
	useEffect(() => {
		const orgId = selectedOrganization?.id;
		if (!orgId) return;
		if (orgId === prevOrgIdRef.current) return;
		prevOrgIdRef.current = orgId;

		// Org changed — clear current project, wait for projects to load
		setProject(null);
		setEnvironment(null);
	}, [selectedOrganization?.id, setProject, setEnvironment]);

	useEffect(() => {
		const orgId = selectedOrganization?.id;
		if (!orgId) return;
		if (orgId !== prevOrgIdRef.current) return;
		if (projectsLoading) return;

		if (projects && projects.length > 0) {
			setProject(projects[0]);
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

	// Search input refs for auto-focus
	const orgSearchRef = useRef<HTMLInputElement>(null);
	const prjSearchRef = useRef<HTMLInputElement>(null);

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
				orgSearchRef.current?.focus();
			}, 50);
			return () => clearTimeout(timer);
		}
	}, [orgMenuOpen]);

	useEffect(() => {
		if (prjMenuOpen && prjSearchRef.current) {
			const timer = setTimeout(() => {
				prjSearchRef.current?.focus();
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
		}
		setMainOpen(false);
		setPrjMenuOpen(false);
	};

	// ── Org hover handlers ──────────────────────────────────────────────
	const handleOrgTriggerEnter = useCallback(() => {
		if (orgLeaveTimer.current) {
			clearTimeout(orgLeaveTimer.current);
			orgLeaveTimer.current = null;
		}
		setPrjMenuOpen(false);
		prjEntered.current = false;

		orgEnterTimer.current = setTimeout(() => {
			setOrgMenuOpen(true);
		}, HOVER_DELAY);
	}, []);

	const handleOrgTriggerLeave = useCallback(() => {
		if (orgEnterTimer.current) {
			clearTimeout(orgEnterTimer.current);
			orgEnterTimer.current = null;
		}
		if (!orgEntered.current) {
			orgLeaveTimer.current = setTimeout(() => {
				setOrgMenuOpen(false);
			}, HOVER_DELAY);
		}
	}, []);

	const handleOrgMenuEnter = useCallback(() => {
		if (orgLeaveTimer.current) {
			clearTimeout(orgLeaveTimer.current);
			orgLeaveTimer.current = null;
		}
		orgEntered.current = true;
	}, []);

	const handleOrgMenuLeave = useCallback(() => {
		orgEntered.current = false;
		setOrgMenuOpen(false);
	}, []);

	// ── Project hover handlers ──────────────────────────────────────────
	const handlePrjTriggerEnter = useCallback(() => {
		if (prjLeaveTimer.current) {
			clearTimeout(prjLeaveTimer.current);
			prjLeaveTimer.current = null;
		}
		setOrgMenuOpen(false);
		orgEntered.current = false;

		prjEnterTimer.current = setTimeout(() => {
			setPrjMenuOpen(true);
		}, HOVER_DELAY);
	}, []);

	const handlePrjTriggerLeave = useCallback(() => {
		if (prjEnterTimer.current) {
			clearTimeout(prjEnterTimer.current);
			prjEnterTimer.current = null;
		}
		if (!prjEntered.current) {
			prjLeaveTimer.current = setTimeout(() => {
				setPrjMenuOpen(false);
			}, HOVER_DELAY);
		}
	}, []);

	const handlePrjMenuEnter = useCallback(() => {
		if (prjLeaveTimer.current) {
			clearTimeout(prjLeaveTimer.current);
			prjLeaveTimer.current = null;
		}
		prjEntered.current = true;
	}, []);

	const handlePrjMenuLeave = useCallback(() => {
		prjEntered.current = false;
		setPrjMenuOpen(false);
	}, []);

	return (
		<Popover isOpen={mainOpen} onOpenChange={setMainOpen}>
			<PopoverTrigger className="w-full data-[pressed=true]:scale-100 active:scale-100">
				{children}
			</PopoverTrigger>
			<PopoverContent
				placement="right top"
				offset={16}
				className="w-64 p-0 overflow-visible">
				<Popover.Dialog className="overflow-visible p-0">
					<div className="flex w-full flex-col p-1 gap-1 overflow-visible">
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
							searchRef={orgSearchRef}
							subMenuMargin="-ml-1"
							subMenuBorder="border"
							createLabel="Create new organization"
						/>

						{/* Org actions */}
						<div className="flex flex-col gap-0.5 px-1 pb-1">
							<Button
								fullWidth
								variant="ghost"
								size="sm"
								className="justify-start text-default-500 h-8">
								<GearIcon size={16} />
								Settings
							</Button>
							<Button
								fullWidth
								variant="ghost"
								size="sm"
								className="justify-start text-default-500 h-8">
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
							searchRef={prjSearchRef}
							isDisabled={!selectedOrganization}
							createLabel="Create new project"
							showDescription
							subMenuMargin="-ml-1"
							subMenuBorder="border"
						/>

						{/* Project actions */}
						<div className="flex flex-col gap-0.5 px-1 pb-1">
							<Button
								fullWidth
								variant="ghost"
								size="sm"
								className="justify-start text-default-500 h-8">
								<GearIcon size={16} />
								Settings
							</Button>
						</div>
					</div>
				</Popover.Dialog>
			</PopoverContent>
		</Popover>
	);
}
