import type { User } from "#/lib/auth-client";
import { generateAvatarColor } from "#/lib/color-from-string";
import { getInitials } from "#/lib/string-utils";
import { Avatar, cn, Skeleton, Tooltip } from "@heroui/react";
import { UserIcon } from "@phosphor-icons/react";

interface UserAvatarProps extends React.ComponentProps<typeof Avatar> {
	user: Partial<User> | null;
	showTooltip?: boolean;
	fallbackClassName?: string;
	imageClassName?: string;
}

const UserAvatar = ({
	user,
	showTooltip = false,
	fallbackClassName,
	imageClassName,
	...props
}: UserAvatarProps) => {
	if (!user)
		return (
			<Avatar {...props}>
				<Avatar.Fallback>
					<Skeleton className="rounded-full" />
				</Avatar.Fallback>
			</Avatar>
		);

	if (!user.name)
		return (
			<Avatar {...props}>
				<Avatar.Fallback>
					<UserIcon />
				</Avatar.Fallback>
			</Avatar>
		);

	const { bg, fg } = generateAvatarColor(user.name);
	const initials = getInitials(user.name);
	const avatar = (
		<Avatar {...props}>
			<Avatar.Image alt={user?.name} src={user?.image || undefined} className={imageClassName} />
			<Avatar.Fallback
				style={{ backgroundColor: bg, color: fg }}
				className={cn(fallbackClassName, "cursor-default select-none")}>
				{initials}
			</Avatar.Fallback>
		</Avatar>
	);

	if (showTooltip) {
		return (
			<Tooltip isDisabled={!showTooltip} delay={200} closeDelay={100}>
				<Tooltip.Trigger>{avatar}</Tooltip.Trigger>
				<Tooltip.Content>
					<p className="font-medium">{user.name}</p>
					{user.email && <p className="text-xs text-muted">{user.email}</p>}
				</Tooltip.Content>
			</Tooltip>
		);
	}
	return avatar;
};

export default UserAvatar;
