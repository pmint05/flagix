import { useEffect } from "react";
import {
	Dropdown,
	DropdownTrigger,
	DropdownMenu,
	DropdownItem,
	Button,
	DropdownPopover,
} from "@heroui/react";
import { CaretDownIcon } from "@phosphor-icons/react";
import { useContextStore } from "@/stores";
import { useOrganizations } from "@/features/organizations/api";
import { useProjects } from "@/features/projects/api";
import { useEnvironments } from "@/features/environments/api";

export function ContextSwitchers() {
	const {
		selectedOrganization,
		selectedProject,
		selectedEnvironment,
		setOrganization,
		setProject,
		setEnvironment,
	} = useContextStore();

	const { data: organizations = [], isLoading: loadingOrgs } =
		useOrganizations();
	const { data: projects = [], isLoading: loadingProjects } = useProjects();
	const { data: environments = [], isLoading: loadingEnvs } = useEnvironments();

	console.log(organizations);

	// Auto-select first organization if none selected
	useEffect(() => {
		if (!selectedOrganization && organizations.length > 0) {
			setOrganization(organizations[0]);
		}
	}, [selectedOrganization, organizations, setOrganization]);

	// Auto-select first project if none selected but we have projects
	useEffect(() => {
		if (!selectedProject && projects.length > 0) {
			setProject(projects[0]);
		}
	}, [selectedProject, projects, setProject]);

	// Auto-select first environment if none selected but we have environments
	useEffect(() => {
		if (!selectedEnvironment && environments.length > 0) {
			setEnvironment(environments[0]);
		}
	}, [selectedEnvironment, environments, setEnvironment]);

	// When organization changes, we might want to clear project/env
	// But the ContextStore actually keeps them if they are still valid, or we could let the user decide.
	// We'll trust the store for now, or just auto-select the new lists.

	return (
		<div className="flex items-center gap-2">
			<ContextDropdown
				label="Organization"
				selected={selectedOrganization?.name ?? "Select org"}
				items={organizations}
				isLoading={loadingOrgs}
				onSelect={(item) => {
					if (item.id !== selectedOrganization?.id) {
						setOrganization(item);
						setProject(null);
						setEnvironment(null);
					}
				}}
			/>
			<ContextDropdown
				label="Project"
				selected={selectedProject?.name ?? "Select project"}
				items={projects}
				isLoading={loadingProjects}
				onSelect={(item) => {
					if (item.id !== selectedProject?.id) {
						setProject(item);
						setEnvironment(null);
					}
				}}
				isDisabled={!selectedOrganization}
			/>
			<ContextDropdown
				label="Environment"
				selected={selectedEnvironment?.name ?? "Select env"}
				items={environments}
				isLoading={loadingEnvs}
				onSelect={(item) => setEnvironment(item)}
				isDisabled={!selectedProject}
			/>
		</div>
	);
}

interface ContextDropdownProps {
	label: string;
	selected: string;
	items: Array<{ id: string; name: string }>;
	isLoading?: boolean;
	isDisabled?: boolean;
	onSelect: (item: any) => void;
}

function ContextDropdown({
	label,
	selected,
	items,
	isLoading,
	isDisabled,
	onSelect,
}: ContextDropdownProps) {
	return (
		<Dropdown>
			<DropdownTrigger
				render={() => (
					<Button
						variant="ghost"
						size="sm"
						className="gap-2"
						isPending={isLoading}
						isDisabled={isDisabled || isLoading}>
						<span className="text-xs text-default-500">{label}:</span>
						<span className="text-sm font-medium">{selected}</span>
						<CaretDownIcon size={14} />
					</Button>
				)}></DropdownTrigger>
			<DropdownPopover>
				<DropdownMenu
					aria-label={`Select ${label}`}
					items={items.length > 0 ? items : [{ id: "empty", name: "No items available" }]}
					disabledKeys={items.length === 0 ? ["empty"] : []}
				>
					{(item) => (
						<DropdownItem key={item.id} onPress={() => {
							if (item.id !== "empty") onSelect(item);
						}}>
							{item.name}
						</DropdownItem>
					)}
				</DropdownMenu>
			</DropdownPopover>
		</Dropdown>
	);
}
