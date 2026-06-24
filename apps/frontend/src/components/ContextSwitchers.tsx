import {
	Dropdown,
	DropdownTrigger,
	DropdownMenu,
	DropdownItem,
	Button,
} from "@heroui/react";
import { CaretDownIcon } from "@phosphor-icons/react";
import { useContextStore } from "@/stores";

export function ContextSwitchers() {
	const {
		selectedOrganization,
		selectedProject,
		selectedEnvironment,
		setOrganization,
		setProject,
		setEnvironment,
	} = useContextStore();

	return (
		<div className="flex items-center gap-2">
			<ContextDropdown
				label="Organization"
				selected={selectedOrganization?.name ?? "Select org"}
				items={[]}
				onSelect={(item) => setOrganization(item)}
			/>
			<ContextDropdown
				label="Project"
				selected={selectedProject?.name ?? "Select project"}
				items={[]}
				onSelect={(item) => setProject(item)}
			/>
			<ContextDropdown
				label="Environment"
				selected={selectedEnvironment?.name ?? "Select env"}
				items={[]}
				onSelect={(item) => setEnvironment(item)}
			/>
		</div>
	);
}

interface ContextDropdownProps {
	label: string;
	selected: string;
	items: Array<{ id: string; name: string }>;
	onSelect: (item: any) => void;
}

function ContextDropdown({
	label,
	selected,
	items,
	onSelect,
}: ContextDropdownProps) {
	return (
		<Dropdown>
			<DropdownTrigger>
				<Button variant="ghost" size="sm" className="gap-2">
					<span className="text-xs text-default-500">{label}:</span>
					<span className="text-sm font-medium">{selected}</span>
					<CaretDownIcon size={14} />
				</Button>
			</DropdownTrigger>
			<DropdownMenu>
				{items.length === 0 ? (
					<DropdownItem key="empty" isDisabled>
						No items available
					</DropdownItem>
				) : (
					items.map((item) => (
						<DropdownItem key={item.id} onAction={() => onSelect(item)}>
							{item.name}
						</DropdownItem>
					))
				)}
			</DropdownMenu>
		</Dropdown>
	);
}
