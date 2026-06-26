import { Dropdown, Button, Label } from "@heroui/react";
import {
	DotsThreeOutlineVerticalIcon,
	CopyIcon,
	GearIcon,
	PlusIcon,
} from "@phosphor-icons/react";
import { useContextStore } from "#/stores";
import { toast } from "sonner";

export function EnvironmentActions() {
	const { selectedEnvironment } = useContextStore();

	const handleCopyId = () => {
		if (selectedEnvironment) {
			navigator.clipboard.writeText(selectedEnvironment.id);
			toast.success("Environment ID copied to clipboard");
		}
	};

	return (
		<Dropdown>
			<Dropdown.Trigger
				render={() => (
					<Button
						variant="ghost"
						size="sm"
						isIconOnly
						aria-label="Environment actions">
						<DotsThreeOutlineVerticalIcon weight="fill" size={16} />
					</Button>
				)}
			/>
			<Dropdown.Popover placement="bottom end">
				<Dropdown.Menu aria-label="Environment Actions">
					<Dropdown.Item
						id="copy"
						onPress={handleCopyId}
						isDisabled={!selectedEnvironment}>
						<CopyIcon size={16} />
						<Label>Copy Environment ID</Label>
					</Dropdown.Item>
					<Dropdown.Item id="settings" onPress={() => toast("Coming soon")}>
						<GearIcon size={16} />
						<Label>Environment Settings</Label>
					</Dropdown.Item>
					<Dropdown.Item id="create" onPress={() => toast("Coming soon")}>
						<PlusIcon size={16} />
						<Label>Create Environment</Label>
					</Dropdown.Item>
				</Dropdown.Menu>
			</Dropdown.Popover>
		</Dropdown>
	);
}
