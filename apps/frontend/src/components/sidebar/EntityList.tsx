import {
	Button,
	Skeleton,
	InputGroup,
	cn,
} from "@heroui/react";
import {
	CheckIcon,
	PlusIcon,
	MagnifyingGlassIcon,
	CaretRightIcon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { generateAvatarColor } from "#/lib/color-from-string";
import { getInitials } from "#/lib/string-utils";

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
	searchRef?: React.RefObject<HTMLInputElement | null>;
	isDisabled?: boolean;
	createLabel?: string;
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
	searchRef,
	isDisabled = false,
	createLabel = "Create new",
	showDescription = false,
	subMenuMargin = "-ml-1",
	subMenuBorder = "border",
}: EntityListProps) {
	const { bg, fg } = selectedItem
		? generateAvatarColor(selectedItem.name)
		: { bg: "#E5E7EB", fg: "#374151" };
	const initials = selectedItem ? getInitials(selectedItem.name) : "";

	const filteredItems = items?.filter((item) => {
		if (!searchValue.trim()) return true;
		const q = searchValue.toLowerCase().trim();
		return (
			item.name.toLowerCase().includes(q) ||
			(showDescription && item.description?.toLowerCase().includes(q))
		);
	}) ?? [];

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
					onMouseLeave={onTriggerLeave}>
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
					<CaretRightIcon
						size={14}
						className={`shrink-0 text-default-400 transition-transform duration-150 ${menuOpen ? "translate-x-0.5" : ""}`}
					/>
				</Button>

				{/* Sub-menu — slides in on hover */}
				<AnimatePresence mode="wait">
					{menuOpen && (
						<motion.div
							animate={{ opacity: 1, x: 0 }}
							initial={{ opacity: 0, x: -8 }}
							exit={{ opacity: 0, x: -8 }}
							transition={{ duration: 0.15 }}
							role="menu"
							className={cn(
								"absolute top-0 left-full w-72 flex-col rounded-medium bg-surface shadow-lg z-50 overflow-hidden transition-all duration-150 ease-out rounded-3xl",
								subMenuMargin,
								subMenuBorder,
								{
									"flex opacity-100 translate-x-0": menuOpen,
									"hidden opacity-0 -translate-x-1 pointer-events-none": !menuOpen,
								},
							)}
							onMouseEnter={onMenuEnter}
							onMouseLeave={onMenuLeave}>
							{/* Search */}
							<div className="px-2 pt-2 pb-1">
								<InputGroup className="w-full" variant="secondary">
									<InputGroup.Prefix>
										<MagnifyingGlassIcon size={14} className="text-default-400" />
									</InputGroup.Prefix>
									<InputGroup.Input
										ref={searchRef}
										aria-label={`Search ${label.toLowerCase()}s`}
										placeholder={`Search ${label.toLowerCase()}s…`}
										value={searchValue}
										onChange={(e) => onSearchChange(e.target.value)}
									/>
								</InputGroup>
							</div>

							{/* Item list */}
							<div className="flex max-h-56 flex-col gap-0.5 overflow-y-auto p-2 pt-1">
								{isLoading ? (
									<>
										<Skeleton className="h-9 w-full rounded-md" />
										<Skeleton className="h-9 w-full rounded-md" />
									</>
								) : filteredItems.length === 0 ? (
									<div className="px-2 py-3 text-center text-sm text-default-400">
										{searchValue ? "No results found." : `No ${label.toLowerCase()}s found.`}
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
														<CheckIcon size={14} className="shrink-0 text-primary" />
													)}
												</div>
												{showDescription && item.description && (
													<span className="truncate text-xs text-default-400 mt-1">
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

							{/* Create new */}
							<div className="border-t border-default-200 p-2">
								<Button
									variant="ghost"
									size="sm"
									className="w-full justify-start text-default-500">
									<PlusIcon size={14} />
									{createLabel}
								</Button>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</>
	);
}
