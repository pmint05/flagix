import {
	Button,
	Dropdown,
	DropdownItem,
	cn,
} from "@heroui/react";
import { PlusIcon, FlagIcon, TargetIcon, KeyIcon } from "@phosphor-icons/react";
import { useUIStore, useSidebarStore } from "#/stores";
import { useHasPermission } from "@/hooks/usePermission";

export function CreateButton() {
	const { isCollapsed } = useSidebarStore();
	const { openCreateFlag, openCreateSegment, openCreateSDKKey } = useUIStore();
	const canCreateFlag = useHasPermission("flag:create");
	const canCreateSDKKey = useHasPermission("sdk-key:create");

	const menuItems = [
		{
			key: "flag",
			label: "Feature Flag",
			icon: FlagIcon,
			action: openCreateFlag,
			disabled: !canCreateFlag,
		},
		{
			key: "segment",
			label: "Segment",
			icon: TargetIcon,
			action: openCreateSegment,
		},
		{
			key: "sdk-key",
			label: "SDK Key",
			icon: KeyIcon,
			action: openCreateSDKKey,
			disabled: !canCreateSDKKey,
		},
	];

	return (
		<>
		<Dropdown>
			<Dropdown.Trigger className="w-full">
				<Button
					fullWidth={!isCollapsed}
					isIconOnly={isCollapsed}
					variant="ghost"
					className={cn("gap-2 hover:bg-accent-soft hover:text-accent", {
						"justify-center px-0": isCollapsed,
						"gap-2": !isCollapsed,
					})}
					render={(props) => (
						<div
							className={cn(props.className, {
								"justify-start": !isCollapsed,
							})}>
							<PlusIcon className="h-4 w-4" />
							{!isCollapsed && <span>Create</span>}
						</div>
					)}
				/>
			</Dropdown.Trigger>
			<Dropdown.Popover placement="right">
				<Dropdown.Menu
					items={menuItems}
					disabledKeys={menuItems.filter((i) => i.disabled).map((i) => i.key)}>
					{(item) => (
						<DropdownItem key={item.key} onAction={item.action}>
							{item.label}
						</DropdownItem>
					)}
				</Dropdown.Menu>
			</Dropdown.Popover>
		</Dropdown>
		</>
	);
}
