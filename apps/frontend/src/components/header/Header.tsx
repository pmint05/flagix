import { Button, Separator } from '@heroui/react';
import { SidebarSimpleIcon } from '@phosphor-icons/react';
import { useSidebarStore } from '#/stores';
import { Breadcrumbs } from './Breadcrumbs';
import { EnvironmentSwitcher } from './EnvironmentSwitcher';

export function Header() {
	const toggleCollapse = useSidebarStore((s) => s.toggleCollapse);

	return (
		<header className="flex h-14 items-center gap-3 px-4">
			<div className="flex items-center gap-3">
				<Button
					variant="ghost"
					size="sm"
					isIconOnly
					onPress={toggleCollapse}
					aria-label="Toggle Sidebar"
				>
					<SidebarSimpleIcon weight="duotone" size={20} />
				</Button>
				<Separator orientation="vertical" className="h-6 self-center" />
				<Breadcrumbs />
			</div>
			<div className="ml-auto flex items-center">
				<EnvironmentSwitcher />
			</div>
		</header>
	);
}
