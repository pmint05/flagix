import { CaretUpDownIcon } from "@phosphor-icons/react";
import { useContextStore, useSidebarStore } from "#/stores";
import { generateAvatarColor } from "#/lib/color-from-string";
import { getInitials, truncateText } from "#/lib/string-utils";
import { OrgProjectSwitcher } from "./OrgProjectSwitcher";
import { Button, cn } from "@heroui/react";
import { useUserInvitations } from "#/features/organizations/api";

export function SidebarHeader() {
	const { selectedOrganization, selectedProject } = useContextStore();
	const { isCollapsed } = useSidebarStore();
	const { data: invitations } = useUserInvitations();
	const hasInvitations = invitations && invitations.length > 0;

	const { bg, fg } = selectedOrganization
		? generateAvatarColor(selectedOrganization.name)
		: { bg: "#E5E7EB", fg: "#374151" }; // Default colors if no organization is selected

	const initials = selectedOrganization
		? getInitials(selectedOrganization.name)
		: "";

	const selectedProjectName = selectedProject
		? truncateText(selectedProject.name, 20)
		: "No project";

	const content = (
		<Button
			excludeFromTabOrder
			variant="ghost"
			className={cn(
				"pl-1.5! flex h-10 w-full items-center justify-start rounded-2xl",
				{
					"justify-center px-0!": isCollapsed,
					"justify-between px-3": !isCollapsed,
				},
			)}>
			<div
				className={cn("flex items-center overflow-hidden", {
					"": isCollapsed,
					"gap-3": !isCollapsed,
				})}>
				{selectedOrganization ? (
					<>
						<div className="relative shrink-0">
							<div
								className="flex h-8 w-8 items-center justify-center rounded-2xl text-xs font-semibold align-middle leading-none"
								style={{
									backgroundColor: bg,
									color: fg,
								}}>
								{initials}
							</div>
							{hasInvitations && (
								<span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 rounded-full bg-orange-500 ring-2 ring-background animate-pulse" />
							)}
						</div>
						<div
							className={cn(
								"flex flex-col overflow-hidden text-left transition-all duration-200",
								{
									"w-0 opacity-0": isCollapsed,
									"w-auto opacity-100": !isCollapsed,
								},
							)}>
							<span className="truncate text-xs text-default-foreground">
								{selectedOrganization.name}
							</span>
							<span className="truncate text-sm font-semibold">
								{selectedProjectName}
							</span>
						</div>
					</>
				) : (
					<div
						className={cn(
							"flex flex-col overflow-hidden text-left transition-all duration-200",
							{
								"w-0 opacity-0": isCollapsed,
								"w-auto opacity-100": !isCollapsed,
							},
						)}>
						<span className="truncate text-sm font-semibold">Select Org</span>
					</div>
				)}
			</div>
			{!isCollapsed && (
				<CaretUpDownIcon
					size={16}
					className="shrink-0 text-default-foreground"
				/>
			)}
		</Button>
	);

	return (
		<div className="p-2 w-full">
			<OrgProjectSwitcher>{content}</OrgProjectSwitcher>
		</div>
	);
}
