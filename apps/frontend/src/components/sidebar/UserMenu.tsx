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
import { AnimatePresence, motion } from "motion/react";

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

export function UserMenu({ children }: UserMenuProps) {
	const user = useAuthStore((s) => s.user);
	const clearSession = useAuthStore((s) => s.clearSession);
	const { theme, setTheme } = useThemeStore();
	const [mainOpen, setMainOpen] = useState(false);

	// Hover state for theme submenu
	const [themeMenuOpen, setThemeMenuOpen] = useState(false);
	const themeEnterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const themeEntered = useRef(false);

	// Cleanup timers on unmount
	useEffect(() => {
		return () => {
			if (themeEnterTimer.current) clearTimeout(themeEnterTimer.current);
		};
	}, []);

	const handleThemeTriggerEnter = useCallback(() => {
		themeEnterTimer.current = setTimeout(() => {
			setThemeMenuOpen(true);
		}, HOVER_DELAY);
	}, []);

	const handleThemeTriggerLeave = useCallback(() => {
		if (themeEnterTimer.current) {
			clearTimeout(themeEnterTimer.current);
			themeEnterTimer.current = null;
		}
		if (!themeEntered.current) {
			setThemeMenuOpen(false);
		}
	}, []);

	const handleThemeMenuEnter = useCallback(() => {
		themeEntered.current = true;
	}, []);

	const handleThemeMenuLeave = useCallback(() => {
		themeEntered.current = false;
		setThemeMenuOpen(false);
	}, []);

	const handleThemeSelect = (value: string) => {
		setTheme(value as "system" | "light" | "dark");
		setThemeMenuOpen(false);
		setMainOpen(false);
	};

	const handleSignOut = async () => {
		try {
			await authClient.signOut();
		} finally {
			clearSession();
		}
	};

	const ThemeIcon = getThemeIcon(theme);

	return (
		<Popover isOpen={mainOpen} onOpenChange={setMainOpen}>
			<PopoverTrigger className="w-full">{children}</PopoverTrigger>
			<PopoverContent
				placement="right bottom"
				offset={16}
				className="w-64 p-0 overflow-visible">
				<Popover.Dialog className="overflow-visible p-0">
					<div className="flex w-full flex-col p-1 gap-1 overflow-visible">
						{/* Header */}
						<div className="flex flex-col px-2 py-1">
							<span className="truncate text-sm font-semibold">
								{user?.name}
							</span>
							<span className="truncate text-xs text-default-400">
								{user?.email}
							</span>
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
								fullWidth>
								<div className="flex items-center gap-2">
									<ThemeIcon size={16} />
									Theme
								</div>
								<div className="flex items-center gap-2">
									<span className="text-xs">{getThemeLabel(theme)}</span>
									<CaretRightIcon
										size={14}
										className={`transition-transform duration-150 ${themeMenuOpen ? "translate-x-0.5" : ""}`}
									/>
								</div>
							</Button>

							{/* Sub-menu */}
							<AnimatePresence mode="wait">
								{themeMenuOpen && (
									<motion.div
										animate={{ opacity: 1, x: 0 }}
										initial={{ opacity: 0, x: -8 }}
										exit={{ opacity: 0, x: -8 }}
										transition={{ duration: 0.15 }}
										role="menu"
										className="absolute top-1/2 -translate-y-1/2 left-full -ml-1 w-44 flex-col rounded-3xl bg-surface shadow-lg z-50 overflow-hidden border p-1"
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
															"bg-default-100": isSelected,
														},
													)}
													fullWidth
													variant="ghost"
													>
													<div className="flex items-center gap-2">
														<Icon size={16} />
														<span className="text-sm font-medium">
															{option.label}
														</span>
													</div>
													{isSelected && (
														<CheckIcon
															size={14}
															className="shrink-0 text-primary"
														/>
													)}
												</Button>
											);
										})}
									</motion.div>
								)}
							</AnimatePresence>
						</div>

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
