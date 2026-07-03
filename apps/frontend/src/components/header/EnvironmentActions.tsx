import { Dropdown, Button, Label, Header } from "@heroui/react";
import {
	DotsThreeOutlineVerticalIcon,
	PencilSimpleIcon,
	PlusIcon,
	HashIcon,
	LinkSimpleIcon,
} from "@phosphor-icons/react";
import { useContextStore } from "#/stores";
import { toast } from "sonner";
import type { Environment } from "#/types/environment";
import { useHasPermission } from "@/hooks/usePermission";

interface EnvironmentActionsProps {
	onOpenCreate: () => void;
	onOpenEdit: (env: Environment) => void;
}

export function EnvironmentActions({
	onOpenCreate,
	onOpenEdit,
}: EnvironmentActionsProps) {
	const { selectedEnvironment } = useContextStore();
	const canCreateEnv = useHasPermission("environment:create");
	const canEditEnv = useHasPermission("environment:edit");

	const handleCopyId = () => {
		if (selectedEnvironment) {
			navigator.clipboard.writeText(selectedEnvironment.id);
			toast.success("Environment ID copied to clipboard");
		}
	};

	const handleCopySlug = () => {
		if (selectedEnvironment) {
			navigator.clipboard.writeText(selectedEnvironment.slug);
			toast.success("Environment slug copied to clipboard");
		}
	};

	const handleEdit = () => {
		if (!selectedEnvironment) {
			toast.info("Select an environment first");
			return;
		}
		onOpenEdit(selectedEnvironment);
	};

	return (
		<Dropdown>
			<Dropdown.Trigger
				render={(props) => (
					<Button
						ref={props.ref}
						variant="secondary"
						size="sm"
						isIconOnly
						aria-label="Environment actions">
						<DotsThreeOutlineVerticalIcon weight="fill" size={16} />
					</Button>
				)}
			/>
			<Dropdown.Popover placement="bottom end">
				<Dropdown.Menu aria-label="Environment Actions">
					<Dropdown.Section>
						<Header>Copy</Header>
						<Dropdown.Item
							id="copy-id"
							onPress={handleCopyId}
							isDisabled={!selectedEnvironment}>
							<HashIcon size={16} />
							<Label>Environment ID</Label>
						</Dropdown.Item>
						<Dropdown.Item
							id="copy-slug"
							onPress={handleCopySlug}
							isDisabled={!selectedEnvironment}>
							<LinkSimpleIcon size={16} />
							<Label>Environment Slug</Label>
						</Dropdown.Item>
					</Dropdown.Section>
					{(canEditEnv || canCreateEnv) && (
						<Dropdown.Section>
							<Header>Manage</Header>
							{canEditEnv && (
								<Dropdown.Item
									id="edit"
									onPress={handleEdit}
									isDisabled={!selectedEnvironment}>
									<PencilSimpleIcon size={16} />
									<Label>Edit Environment</Label>
								</Dropdown.Item>
							)}
							{canCreateEnv && (
								<Dropdown.Item id="create" onPress={onOpenCreate}>
									<PlusIcon size={16} />
									<Label>Create Environment</Label>
								</Dropdown.Item>
							)}
						</Dropdown.Section>
					)}
				</Dropdown.Menu>
			</Dropdown.Popover>
		</Dropdown>
	);
}
