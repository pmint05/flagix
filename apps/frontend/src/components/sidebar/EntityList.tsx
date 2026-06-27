import { Button, Skeleton, cn, SearchField } from "@heroui/react";
import {
	CheckIcon,
	PlusIcon,
	MagnifyingGlassIcon,
	CaretRightIcon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { generateAvatarColor } from "#/lib/color-from-string";
import { getInitials } from "#/lib/string-utils";
import { useEffect } from "react";
import { useIsMobile } from "#/hooks/useIsMobile";

interface EntityItem {
	id: string;
	name: string;
	description?: string | null;
}

interface EntityListProps {
	label: string;
	items: EntityItem[] | undefined;
	isLoading: boolean;
	selectedItem: EntityItem | null;
	searchValue: string;
	onSearchChange: (value: string) => void;
	onSelect: (item: EntityItem) => void;
	menuOpen: boolean;
	onTriggerEnter: () => void;
	onTriggerLeave: () => void;
	onMenuEnter: () => void;
	onMenuLeave: () => void;
	onTriggerClick?: () => void;
	searchRef?: React.RefObject<HTMLInputElement | null>;
	isDisabled?: boolean;
	bottomContent?: React.ReactNode;
	showDescription?: boolean;
	subMenuMargin?: string;
	subMenuBorder?: string;
}

export function EntityList({
	label,
	items,
	isLoading,
	selectedItem,
	searchValue,
	onSearchChange,
	onSelect,
	menuOpen,
	onTriggerEnter,
	onTriggerLeave,
	onMenuEnter,
	onMenuLeave,
	onTriggerClick,
	searchRef,
	isDisabled = false,
	bottomContent,
	showDescription = false,
	subMenuMargin = "-ml-1",
	subMenuBorder = "border",
}: EntityListProps) {
	const { bg, fg } = selectedItem
		? generateAvatarColor(selectedItem.name)
		: { bg: "#E5E7EB", fg: "#374151" };
	const initials = selectedItem ? getInitials(selectedItem.name) : "";

	const filteredItems =
		items?.filter((item) => {
			if (!searchValue.trim()) return true;
			const q = searchValue.toLowerCase().trim();
			return (
				item.name.toLowerCase().includes(q) ||
				(showDescription && item.description?.toLowerCase().includes(q))
			);
		}) ?? [];

	useEffect(() => {
		if (!menuOpen && searchRef?.current && searchRef.current.value) {
			onSearchChange("");
		}
	}, [menuOpen]);

	const isMobile = useIsMobile();
	const animation = isMobile
		? {
				opacity: menuOpen ? 1 : 0,
				y: menuOpen ? 0 : -8,
			}
		: {
				opacity: menuOpen ? 1 : 0,
				x: menuOpen ? 0 : -8,
			};

	return (
		<>
			<div className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-muted">
				{label}
			</div>

			<div className="relative w-full">
				{/* Bridge: fills the gap between trigger and sub-menu so hover is continuous */}
				{menuOpen && (
					<div
						className="absolute top-0 right-0 h-full w-6 translate-x-full z-40"
						onMouseEnter={onMenuEnter}
						onMouseLeave={onMenuLeave}
					/>
				)}
				{/* Trigger Row — avatar + name + caret */}
				<Button
					variant="ghost"
					size="sm"
					className={cn("justify-between text-default-foreground", {
						"bg-default": menuOpen,
					})}
					fullWidth
					isDisabled={isDisabled}
					onMouseEnter={onTriggerEnter}
					onMouseLeave={onTriggerLeave}
					onPress={onTriggerClick}>
					<div className="flex items-center gap-2 overflow-hidden">
						<div
							className="flex size-5 shrink-0 items-center justify-center rounded-xl text-[10px] font-semibold"
							style={{ backgroundColor: bg, color: fg }}>
							{initials}
						</div>
						<span className="truncate font-medium">
							{selectedItem?.name ?? `Select ${label}`}
						</span>
					</div>
					<CaretRightIcon size={14} className="shrink-0" />
				</Button>

				{/* Sub-menu — slides in on hover */}
				<motion.div
					animate={{
						...animation,
						visibility: menuOpen ? "visible" : "hidden",
					}}
					initial={false}
					transition={{ duration: 0.15 }}
					role="menu"
					className={cn(
						"absolute top-0 left-full w-72 flex flex-col bg-surface shadow-lg z-50 overflow-hidden rounded-3xl",
						subMenuMargin,
						subMenuBorder,
						{
							"left-0 top-full": isMobile,
						},
					)}
					onMouseEnter={onMenuEnter}
					onMouseLeave={onMenuLeave}>
					{/* Search */}
					<div className="px-2 pt-2 pb-1">
						<SearchField
							name="search"
							variant="secondary"
							onClear={() => onSearchChange("")}>
							<SearchField.Group>
								<SearchField.SearchIcon>
									<MagnifyingGlassIcon weight="bold" />
								</SearchField.SearchIcon>
								<SearchField.Input
									className="w-full"
									ref={searchRef}
									aria-label={`Search ${label.toLowerCase()}s`}
									placeholder={`Search ${label.toLowerCase()}s…`}
									value={searchValue}
									onChange={(e) => onSearchChange(e.target.value)}
								/>
								<SearchField.ClearButton />
							</SearchField.Group>
						</SearchField>
					</div>

					{/* Item list */}
					<div className="flex max-h-56 flex-col gap-0.5 overflow-y-auto p-2 pt-1">
						{isLoading ? (
							<>
								<Skeleton className="h-9 w-full rounded-md" />
								<Skeleton className="h-9 w-full rounded-md" />
							</>
						) : filteredItems.length === 0 ? (
							<div className="px-2 py-3 text-center text-sm">
								{searchValue
									? "No results found."
									: `No ${label.toLowerCase()}s found.`}
							</div>
						) : (
							filteredItems.map((item) => {
								const { bg, fg } = generateAvatarColor(item.name);
								const isSelected = selectedItem?.id === item.id;
								return (
									<Button
										key={item.id}
										excludeFromTabOrder
										variant="ghost"
										fullWidth
										onClick={() => onSelect(item)}
										className={cn(
											"flex cursor-pointer flex-col px-2 py-1.5",
											isSelected && "bg-default-soft",
										)}>
										<div className="flex items-center justify-between w-full">
											<div className="flex items-center gap-2.5 overflow-hidden">
												<div
													className="flex size-5 shrink-0 items-center justify-center rounded-xl text-[10px] font-semibold"
													style={{ backgroundColor: bg, color: fg }}>
													{getInitials(item.name)}
												</div>
												<span className="truncate text-sm font-medium">
													{item.name}
												</span>
											</div>
											{isSelected && (
												<CheckIcon
													size={14}
													className="shrink-0 text-primary"
												/>
											)}
										</div>
										{showDescription && item.description && (
											<span className="truncate text-xs mt-1">
												{item.description.length > 45
													? `${item.description.slice(0, 45)}…`
													: item.description}
											</span>
										)}
									</Button>
								);
							})
						)}
					</div>

					{/* Dynamic Actions */}
					{bottomContent && (
						<div className="border-t border-divider p-2">
							{bottomContent}
						</div>
					)}
				</motion.div>
			</div>
		</>
	);
}
