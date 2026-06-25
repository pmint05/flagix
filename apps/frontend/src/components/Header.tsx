import {
	Dropdown,
	DropdownTrigger,
	DropdownMenu,
	DropdownItem,
	Button,
} from "@heroui/react";
import { CaretDownIcon, UserIcon } from "@phosphor-icons/react";
import { authClient } from "@/lib/auth-client";
import { useAuthStore } from "@/stores";
import { ContextSwitchers } from "./ContextSwitchers";

export function Header() {
	const authStore = useAuthStore();

	return (
		<header className="flex h-14 items-center border-b border-default-200 bg-content1 px-4">
			<div className="flex flex-1 items-center gap-4">
				<ContextSwitchers />
			</div>
			<div className="flex items-center gap-3">
				<Dropdown>
					<DropdownTrigger
						render={() => (
							<Button variant="ghost" size="sm" className="gap-2">
								<UserIcon size={16} />
								<span className="text-sm">{authStore.user?.email}</span>
								<CaretDownIcon size={14} />
							</Button>
						)}></DropdownTrigger>
					<DropdownMenu>
						<DropdownItem
							key="signout"
							className="text-danger"
							onAction={() => {
								authStore.clearSession();
								authClient.signOut();
							}}>
							Sign out
						</DropdownItem>
					</DropdownMenu>
				</Dropdown>
			</div>
		</header>
	);
}
