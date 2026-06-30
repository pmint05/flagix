import { Button, cn } from "@heroui/react";
import { useAuthStore, useSidebarStore } from "#/stores";
import { generateAvatarColor } from "#/lib/color-from-string";
import { getInitials } from "#/lib/string-utils";
import { UserMenu } from "./UserMenu";
import { DotsThreeVerticalIcon } from "@phosphor-icons/react";
import { maskEmail } from "@/lib/masking";

export function SidebarFooter() {
	const user = useAuthStore((s) => s.user);
	const { isCollapsed } = useSidebarStore();

	if (!user) return null;

	const { bg, fg } = generateAvatarColor(user.name);
	const initials = getInitials(user.name);

	const avatar = (
		<div
			className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl text-xs font-semibold"
			style={{ backgroundColor: bg, color: fg }}>
			{initials}
		</div>
	);

	const buttonContent = (
		<Button
			variant="ghost"
			excludeFromTabOrder
			className={cn("flex w-full items-center justify-start rounded-2xl", {
				"justify-center px-0 gap-0": isCollapsed,
				"gap-3 justify-between pl-1!": !isCollapsed,
			})}>
			<div
				className={cn("flex items-center gap-3", {
					"justify-center gap-0": isCollapsed,
				})}>
				{avatar}
				<div
					className={cn(
						"flex flex-col overflow-hidden text-left transition-all duration-200",
						{
							"w-0 opacity-0 invisible": isCollapsed,
							"w-auto opacity-100 visible": !isCollapsed,
						},
					)}>
					<span className="truncate text-sm font-medium">{user.name}</span>
					<span className="truncate text-xs text-muted">
						{maskEmail(user.email)}
					</span>
				</div>
			</div>
			{!isCollapsed && (
				<DotsThreeVerticalIcon className="shrink-0 text-default-foreground" />
			)}
		</Button>
	);

	// The UserMenu handles the DropdownTrigger internally wrapping its children
	const trigger = <UserMenu>{buttonContent}</UserMenu>;

	return (
		<div className="border-t p-2">
			{/* {isCollapsed ? (
				<Tooltip delay={0}>
					<Tooltip.Trigger>
						<div className="w-full">{trigger}</div>
					</Tooltip.Trigger>
					<Tooltip.Content placement="right">
						<span className="text-sm">{user.name}</span>
					</Tooltip.Content>
				</Tooltip>
			) : ( */}
			{trigger}
			{/* )} */}
		</div>
	);
}
