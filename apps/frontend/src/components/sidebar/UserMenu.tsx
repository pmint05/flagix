import { useState, useCallback, useRef, useEffect } from "react";
import {
	Popover,
	PopoverTrigger,
	PopoverContent,
	Button,
	Separator,
	cn,
} from "@heroui/react";
import {
	UserIcon,
	SignOutIcon,
	MonitorIcon,
	SunIcon,
	MoonIcon,
	CheckIcon,
	CaretRightIcon,
} from "@phosphor-icons/react";
import { useAuthStore, useThemeStore } from "#/stores";
import { authClient } from "#/lib/auth-client";
import type React from "react";
import { motion } from "motion/react";
import { useIsMobile } from "#/hooks/useIsMobile";
import { maskEmail } from "#/lib/masking";

interface UserMenuProps {
	children: React.ReactNode;
}

const HOVER_DELAY = 120;

const themeOptions = [
	{ value: "system", label: "System", icon: MonitorIcon },
	{ value: "light", label: "Light", icon: SunIcon },
	{ value: "dark", label: "Dark", icon: MoonIcon },
] as const;

function getThemeIcon(theme: string) {
	const option = themeOptions.find((o) => o.value === theme);
	return option?.icon ?? MonitorIcon;
}

function getThemeLabel(theme: string) {
	const option = themeOptions.find((o) => o.value === theme);
	return option?.label ?? "System";
}

function ThemeGroup({
	theme,
	setTheme,
	setMainOpen,
}: {
	theme: string;
	setTheme: (t: any) => void;
	setMainOpen: (b: boolean) => void;
}) {
	// Hover state for theme submenu
	const [themeMenuOpen, setThemeMenuOpen] = useState(false);
	const themeEnterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const themeEntered = useRef(false);
	const isMobile = useIsMobile();

	// Cleanup timers on unmount
	useEffect(() => {
		return () => {
			if (themeEnterTimer.current) clearTimeout(themeEnterTimer.current);
		};
	}, []);

	const handleThemeTriggerEnter = useCallback(() => {
		if (isMobile) return;
		themeEnterTimer.current = setTimeout(() => {
			setThemeMenuOpen(true);
		}, HOVER_DELAY);
	}, [isMobile]);

	const handleThemeTriggerLeave = useCallback(() => {
		if (isMobile) return;
		if (themeEnterTimer.current) {
			clearTimeout(themeEnterTimer.current);
			themeEnterTimer.current = null;
		}
		if (!themeEntered.current) {
			setThemeMenuOpen(false);
		}
	}, [isMobile]);

	const handleThemeMenuEnter = useCallback(() => {
		if (isMobile) return;
		themeEntered.current = true;
	}, [isMobile]);

	const handleThemeMenuLeave = useCallback(() => {
		if (isMobile) return;
		themeEntered.current = false;
		setThemeMenuOpen(false);
	}, [isMobile]);

	const handleThemeTriggerClick = useCallback(() => {
		setThemeMenuOpen((prev) => !prev);
	}, []);

	const handleThemeSelect = (value: string) => {
		setTheme(value as "system" | "light" | "dark");
		setThemeMenuOpen(false);
		setMainOpen(false);
	};

	const ThemeIcon = getThemeIcon(theme);

	const animation = isMobile
		? { opacity: themeMenuOpen ? 1 : 0, y: themeMenuOpen ? 0 : 8 }
		: { opacity: themeMenuOpen ? 1 : 0, x: themeMenuOpen ? 0 : -8 };

	return (
		<div
			className="relative w-full"
			onMouseEnter={handleThemeTriggerEnter}
			onMouseLeave={handleThemeTriggerLeave}>
			{/* Bridge */}
			{themeMenuOpen && (
				<div
					className="absolute top-0 right-0 h-full w-2 translate-x-full z-40"
					onMouseEnter={handleThemeTriggerEnter}
					onMouseLeave={handleThemeTriggerLeave}
				/>
			)}
			{/* Trigger Row */}
			<Button
				variant="ghost"
				size="sm"
				className={cn("justify-between text-default-foreground", {
					"bg-default": themeMenuOpen,
				})}
				onPress={handleThemeTriggerClick}
				fullWidth>
				<div className="flex items-center gap-2">
					<ThemeIcon size={16} />
					Theme
				</div>
				<div className="flex items-center gap-2">
					<span className="text-xs">{getThemeLabel(theme)}</span>
					<CaretRightIcon size={14} />
				</div>
			</Button>

			{/* Sub-menu */}
			<motion.div
				animate={{
					...animation,
					visibility: themeMenuOpen ? "visible" : "hidden",
				}}
				initial={false}
				transition={{ duration: 0.15 }}
				role="menu"
				className={cn(
					"absolute top-1/2 -translate-y-1/2 left-full -ml-1 w-44 flex flex-col rounded-3xl bg-surface shadow-lg z-50 overflow-hidden border p-1",
					{
						"left-0 -translate-y-full top-0": isMobile,
					},
				)}
				onMouseEnter={handleThemeMenuEnter}
				onMouseLeave={handleThemeMenuLeave}>
				{themeOptions.map((option) => {
					const Icon = option.icon;
					const isSelected = theme === option.value;
					return (
						<Button
							key={option.value}
							excludeFromTabOrder
							onClick={() => handleThemeSelect(option.value)}
							className={cn(
								"flex cursor-pointer items-center justify-between rounded-3xl px-2 py-1.5 transition-colors",
								{
									"bg-default-soft": isSelected,
								},
							)}
							fullWidth
							variant="ghost">
							<div className="flex items-center gap-2">
								<Icon size={16} />
								<span className="text-sm font-medium">{option.label}</span>
							</div>
							{isSelected && (
								<CheckIcon size={14} className="shrink-0 text-primary" />
							)}
						</Button>
					);
				})}
			</motion.div>
		</div>
	);
}

export function UserMenu({ children }: UserMenuProps) {
	const user = useAuthStore((s) => s.user);
	const clearSession = useAuthStore((s) => s.clearSession);
	const { theme, setTheme } = useThemeStore();
	const [mainOpen, setMainOpen] = useState(false);

	const handleSignOut = async () => {
		try {
			await authClient.signOut();
		} finally {
			clearSession();
		}
	};

	const isMobile = useIsMobile();

	return (
		<Popover isOpen={mainOpen} onOpenChange={setMainOpen}>
			<PopoverTrigger className="w-full">{children}</PopoverTrigger>
			<PopoverContent
				placement={isMobile ? "top start" : "right bottom"}
				offset={isMobile ? 8 : 16}
				className="w-64 p-0 overflow-visible">
				<Popover.Dialog className="overflow-visible p-0">
					<div className="flex w-full flex-col p-1 gap-1 overflow-visible">
						{/* Header */}
						<div className="flex flex-col px-2 py-1">
							<span className="truncate text-sm font-semibold">
								{user?.name}
							</span>
							<span className="truncate text-xs">{maskEmail(user?.email)}</span>
						</div>

						<Separator className="my-1" />

						<div className="flex flex-col gap-0.5">
							<Button
								variant="ghost"
								size="sm"
								className="justify-start"
								fullWidth>
								<UserIcon size={16} />
								Profile
							</Button>
						</div>

						<Separator className="my-1" />

						{/* ═══════════════════ THEME GROUP ═══════════════════ */}
						<ThemeGroup
							theme={theme}
							setTheme={setTheme}
							setMainOpen={setMainOpen}
						/>

						<Separator className="my-1" />

						{/* Sign Out */}
						<div className="flex flex-col gap-0.5">
							<Button
								variant="ghost"
								size="sm"
								className="justify-start text-danger hover:bg-danger-soft"
								onPress={handleSignOut}
								fullWidth>
								<SignOutIcon size={16} />
								Sign out
							</Button>
						</div>
					</div>
				</Popover.Dialog>
			</PopoverContent>
		</Popover>
	);
}
