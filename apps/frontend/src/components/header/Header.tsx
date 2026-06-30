import { Button, Separator } from '@heroui/react';
import { SidebarSimpleIcon } from '@phosphor-icons/react';
import { useSidebarStore } from '#/stores';
import { Breadcrumbs } from './Breadcrumbs';
import { EnvironmentSwitcher } from './EnvironmentSwitcher';
import { useIsMobile } from '#/hooks/useIsMobile';
import { useMatches } from '@tanstack/react-router';

export function Header() {
	const toggleCollapse = useSidebarStore((s) => s.toggleCollapse);
	const toggleDrawer = useSidebarStore((s) => s.toggleDrawer);
	const isMobile = useIsMobile();
	const matches = useMatches();
	
	const hideEnvironmentSwitcher = matches.some(
		(match) => (match.staticData as any)?.hideEnvironmentSwitcher
	);

	return (
		<header className="flex h-14 shrink-0 items-center gap-2.5 sm:px-4 px-2">
			<div className="flex items-center sm:gap-2.5 gap-1">
				<Button
					variant="ghost"
					size="sm"
					isIconOnly
					onPress={isMobile ? toggleDrawer : toggleCollapse}
					aria-label="Toggle Sidebar"
				>
					<SidebarSimpleIcon weight="duotone" size={20} />
				</Button>
				<Separator orientation="vertical" className="h-6 self-center" />
				<Breadcrumbs />
			</div>
			<div className="ml-auto flex items-center">
				{!hideEnvironmentSwitcher && <EnvironmentSwitcher />}
			</div>
		</header>
	);
}
