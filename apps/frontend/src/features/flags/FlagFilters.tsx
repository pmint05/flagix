"use client";

import type { Key } from "@heroui/react";
import type { DateValue } from "@internationalized/date";
import type { RangeValue } from "@react-types/shared";

import {
	Autocomplete,
	Button,
	DateField,
	DateRangePicker,
	Description,
	Label,
	ListBox,
	Popover,
	RangeCalendar,
	SearchField,
	Tag,
	TagGroup,
	useFilter,
} from "@heroui/react";
import { FadersIcon, XIcon, CalendarBlankIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import {
	getLocalTimeZone,
	parseDate,
	today,
	startOfMonth,
} from "@internationalized/date";
import { useContextStore } from "@/stores";
import { useOrganizationUsers } from "@/features/organizations/api";
import UserAvatar from "#/components/user/user-avatar";
import { TagInput } from "@/components/ui/tag-input";

const STATUS_OPTIONS = [
	{ key: "draft", label: "Draft" },
	{ key: "active", label: "Active" },
	{ key: "archived", label: "Archived" },
];

const TYPE_OPTIONS = [
	{ key: "boolean", label: "Boolean" },
	{ key: "multivariate", label: "Multivariate" },
];

const VISIBILITY_OPTIONS = [
	{ key: "all", label: "All" },
	{ key: "client_only", label: "Client only" },
	{ key: "server_only", label: "Server only" },
];

export const TEMPORARY_OPTIONS = [
	{ key: "true", label: "Temporary" },
	{ key: "false", label: "Permanent" },
];

export interface FlagFiltersState {
	[key: string]: unknown | undefined;
	status?: string[];
	flagType?: string[];
	visibility?: string[];
	isTemporary?: string[];
	creator?: string;
	createdAtFrom?: string;
	createdAtTo?: string;
	tags?: string[];
}

interface FlagFiltersProps {
	filters: FlagFiltersState;
	onChange: (filters: FlagFiltersState) => void;
	searchQuery: string;
	onSearchChange: (query: string) => void;
}

function toDateValue(iso?: string): DateValue | undefined {
	if (!iso) return undefined;
	try {
		return parseDate(iso.slice(0, 10));
	} catch {
		return undefined;
	}
}

function toIsoString(value: DateValue | null | undefined): string | undefined {
	if (!value) return undefined;
	return value.toDate(getLocalTimeZone()).toISOString();
}

function normalizeArray(value: unknown): string[] {
	if (Array.isArray(value)) return value as string[];
	if (typeof value === "string") return [value];
	return [];
}

function setArrayFilter(
	filters: FlagFiltersState,
	key: keyof FlagFiltersState,
	keys: Iterable<Key>,
): FlagFiltersState {
	const selected = Array.from(keys) as string[];
	return { ...filters, [key]: selected.length > 0 ? selected : undefined };
}

export function FlagFilters({
	filters,
	onChange,
	searchQuery,
	onSearchChange,
}: FlagFiltersProps) {
	const orgId = useContextStore((s) => s.selectedOrganization?.id);
	const { data: users } = useOrganizationUsers(orgId ?? "");
	const { contains } = useFilter({ sensitivity: "base" });

	const statusSelected = normalizeArray(filters.status);
	const typeSelected = normalizeArray(filters.flagType);
	const visibilitySelected = normalizeArray(filters.visibility);
	const isTemporarySelected = normalizeArray(filters.isTemporary);

	const dateRangeValue: RangeValue<DateValue> | null =
		filters.createdAtFrom && filters.createdAtTo
			? {
					start: toDateValue(filters.createdAtFrom)!,
					end: toDateValue(filters.createdAtTo)!,
				}
			: null;

	const selectedUser = users?.find((u) => u.userId === filters.creator);

	const activeTags = buildActiveTags(filters, users ?? []);

	const applyPreset = (days: number | "month") => {
		const zone = getLocalTimeZone();
		const now = today(zone);
		let start: DateValue;
		let end: DateValue = now;

		if (days === "month") {
			start = startOfMonth(now);
		} else {
			start = now.subtract({ days: days - 1 });
		}

		onChange({
			...filters,
			createdAtFrom: toIsoString(start),
			createdAtTo: toIsoString(end),
		});
	};

	const clearDateRange = () => {
		onChange({
			...filters,
			createdAtFrom: undefined,
			createdAtTo: undefined,
		});
	};

	return (
		<div className="flex flex-col gap-3">
			<div className="flex flex-wrap items-center gap-2">
				<SearchField
					value={searchQuery}
					onChange={onSearchChange}
					variant="secondary"
					aria-label="Search flags"
					className="w-full sm:w-72">
					<SearchField.Group>
						<SearchField.SearchIcon>
							<MagnifyingGlassIcon className="text-muted-foreground" />
						</SearchField.SearchIcon>
						<SearchField.Input placeholder="Search by key or name..." />
						<SearchField.ClearButton onPress={() => onSearchChange("")} />
					</SearchField.Group>
				</SearchField>
				<Popover>
					<Popover.Trigger>
						<Button variant="secondary" className="gap-2">
							<FadersIcon className="size-4" />
							Filters
						</Button>
					</Popover.Trigger>
					<Popover.Content className="w-80 sm:w-96" placement="bottom start">
						<Popover.Dialog>
							<Popover.Heading className="text-sm font-semibold">
								Filter flags
							</Popover.Heading>
							<div className="mt-4 flex flex-col gap-5">
								<FilterTagGroup
									label="Status"
									options={STATUS_OPTIONS}
									selectedKeys={statusSelected}
									onSelectionChange={(keys) =>
										onChange(setArrayFilter(filters, "status", keys))
									}
								/>

								<FilterTagGroup
									label="Flag type"
									options={TYPE_OPTIONS}
									selectedKeys={typeSelected}
									onSelectionChange={(keys) =>
										onChange(setArrayFilter(filters, "flagType", keys))
									}
								/>

								<FilterTagGroup
									label="Visibility"
									options={VISIBILITY_OPTIONS}
									selectedKeys={visibilitySelected}
									onSelectionChange={(keys) =>
										onChange(setArrayFilter(filters, "visibility", keys))
									}
								/>

								<FilterTagGroup
									label="Flag expiration"
									options={TEMPORARY_OPTIONS}
									selectedKeys={isTemporarySelected}
									onSelectionChange={(keys) =>
										onChange(setArrayFilter(filters, "isTemporary", keys))
									}
								/>

								<div className="flex flex-col gap-2">
									<Label className="text-xs font-medium text-muted-foreground">
										Tags
									</Label>
									<TagInput
										value={filters.tags || []}
										onChange={(tags) =>
											onChange({
												...filters,
												tags: tags.length > 0 ? tags : undefined,
											})
										}
										placeholder="Filter by tags..."
										allowCreation={false}
									/>
								</div>

								<div className="flex flex-col gap-2">
									<Label className="text-xs font-medium text-muted-foreground">
										Created by
									</Label>
									<Autocomplete
										variant="secondary"
										placeholder="Select user"
										value={filters.creator ?? null}
										onChange={(key) =>
											onChange({
												...filters,
												creator: (key as string) || undefined,
											})
										}>
										<Autocomplete.Trigger>
											<Autocomplete.Value>
												{({ isPlaceholder }) =>
													isPlaceholder || !selectedUser ? (
														"Select user"
													) : (
														<div className="flex items-center gap-2">
															<UserAvatar
																user={{
																	name: selectedUser.name,
																}}
																size="sm"
																className="size-5"
																fallbackClassName="text-xs"
															/>
															<span>{selectedUser.name}</span>
														</div>
													)
												}
											</Autocomplete.Value>
											<Autocomplete.ClearButton />
											<Autocomplete.Indicator />
										</Autocomplete.Trigger>
										<Autocomplete.Popover>
											<Autocomplete.Filter filter={contains}>
												<SearchField
													autoFocus
													variant="secondary"
													aria-label="Search users">
													<SearchField.Group>
														<SearchField.SearchIcon />
														<SearchField.Input placeholder="Search users..." />
														<SearchField.ClearButton />
													</SearchField.Group>
												</SearchField>
												<ListBox>
													{(users ?? []).map((user) => (
														<ListBox.Item
															key={user.userId}
															id={user.userId}
															textValue={user.name}>
															<UserAvatar
																user={{ name: user.name }}
																size="sm"
																className="size-5"
																fallbackClassName="text-xs"
															/>
															<div className="flex flex-col">
																<Label>{user.name}</Label>
																{user.email && (
																	<Description>{user.email}</Description>
																)}
															</div>
															<ListBox.ItemIndicator />
														</ListBox.Item>
													))}
												</ListBox>
											</Autocomplete.Filter>
										</Autocomplete.Popover>
									</Autocomplete>
								</div>

								<div className="flex flex-col gap-2">
									<Label className="text-xs font-medium text-muted-foreground">
										Created between
									</Label>
									<DateRangePicker
										value={dateRangeValue}
										onChange={(range) =>
											onChange({
												...filters,
												createdAtFrom: toIsoString(range?.start),
												createdAtTo: toIsoString(range?.end),
											})
										}>
										<DateField.Group fullWidth variant="secondary">
											<DateField.Input slot="start">
												{(segment) => <DateField.Segment segment={segment} />}
											</DateField.Input>
											<DateRangePicker.RangeSeparator />
											<DateField.Input slot="end">
												{(segment) => <DateField.Segment segment={segment} />}
											</DateField.Input>
											<DateField.Suffix>
												<DateRangePicker.Trigger>
													<CalendarBlankIcon className="size-4 text-muted-foreground" />
												</DateRangePicker.Trigger>
											</DateField.Suffix>
										</DateField.Group>
										<DateRangePicker.Popover>
											<RangeCalendar aria-label="Created between">
												<RangeCalendar.Header>
													<RangeCalendar.YearPickerTrigger>
														<RangeCalendar.YearPickerTriggerHeading />
														<RangeCalendar.YearPickerTriggerIndicator />
													</RangeCalendar.YearPickerTrigger>
													<RangeCalendar.NavButton slot="previous" />
													<RangeCalendar.NavButton slot="next" />
												</RangeCalendar.Header>
												<RangeCalendar.Grid>
													<RangeCalendar.GridHeader>
														{(day) => (
															<RangeCalendar.HeaderCell>
																{day}
															</RangeCalendar.HeaderCell>
														)}
													</RangeCalendar.GridHeader>
													<RangeCalendar.GridBody>
														{(date) => <RangeCalendar.Cell date={date} />}
													</RangeCalendar.GridBody>
												</RangeCalendar.Grid>
											</RangeCalendar>
										</DateRangePicker.Popover>
									</DateRangePicker>
									<div className="flex flex-wrap gap-2">
										<PresetButton onPress={() => applyPreset(7)}>
											Last 7 days
										</PresetButton>
										<PresetButton onPress={() => applyPreset(30)}>
											Last 30 days
										</PresetButton>
										<PresetButton onPress={() => applyPreset("month")}>
											This month
										</PresetButton>
										<PresetButton onPress={clearDateRange}>Clear</PresetButton>
									</div>
								</div>
							</div>
						</Popover.Dialog>
					</Popover.Content>
				</Popover>
			</div>

			{activeTags.length > 0 && (
				<div className="flex flex-wrap items-center gap-2 mt-1">
					<TagGroup
						selectionMode="none"
						onRemove={(keys) => {
							const removed = Array.from(keys) as string[];
							let next = { ...filters };
							for (const key of removed) {
								next = removeTag(next, key);
							}
							onChange(next);
						}}>
						<TagGroup.List className="flex-wrap gap-2">
							{activeTags.map((tag) => (
								<Tag
									key={tag.key}
									id={tag.key}
									textValue={tag.label}
									className="gap-1">
									{tag.label}
									<Tag.RemoveButton>
										<XIcon className="size-3" />
									</Tag.RemoveButton>
								</Tag>
							))}
						</TagGroup.List>
					</TagGroup>
					<Button
						variant="ghost"
						size="sm"
						onPress={() => onChange({})}
						className="text-muted-foreground text-xs h-7 px-2">
						Clear all
					</Button>
				</div>
			)}
		</div>
	);
}

function FilterTagGroup({
	label,
	options,
	selectedKeys,
	onSelectionChange,
}: {
	label: string;
	options: Array<{ key: string; label: string }>;
	selectedKeys: string[];
	onSelectionChange: (keys: Iterable<Key>) => void;
}) {
	return (
		<div className="flex flex-col gap-2">
			<Label className="text-xs font-medium text-muted-foreground">
				{label}
			</Label>
			<TagGroup
				selectionMode="multiple"
				selectedKeys={selectedKeys}
				onSelectionChange={onSelectionChange}>
				<TagGroup.List className="flex-wrap gap-2">
					{options.map((option) => (
						<Tag key={option.key} id={option.key} textValue={option.label}>
							{option.label}
						</Tag>
					))}
				</TagGroup.List>
			</TagGroup>
		</div>
	);
}

function PresetButton({
	children,
	onPress,
}: {
	children: React.ReactNode;
	onPress: () => void;
}) {
	return (
		<Button variant="tertiary" size="sm" onPress={onPress}>
			{children}
		</Button>
	);
}

interface ActiveTag {
	key: string;
	label: string;
}

function buildActiveTags(
	filters: FlagFiltersState,
	users: Array<{ userId: string; name: string }>,
): ActiveTag[] {
	const tags: ActiveTag[] = [];

	for (const key of filters.status ?? []) {
		const option = STATUS_OPTIONS.find((o) => o.key === key);
		if (option)
			tags.push({ key: `status:${key}`, label: `Status: ${option.label}` });
	}
	for (const key of filters.flagType ?? []) {
		const option = TYPE_OPTIONS.find((o) => o.key === key);
		if (option)
			tags.push({ key: `flagType:${key}`, label: `Type: ${option.label}` });
	}
	for (const key of filters.visibility ?? []) {
		const option = VISIBILITY_OPTIONS.find((o) => o.key === key);
		if (option)
			tags.push({
				key: `visibility:${key}`,
				label: `Visibility: ${option.label}`,
			});
	}
	for (const key of filters.isTemporary ?? []) {
		const option = TEMPORARY_OPTIONS.find((o) => o.key === key);
		if (option)
			tags.push({
				key: `isTemporary:${key}`,
				label: `Expiration: ${option.label}`,
			});
	}
	if (filters.creator) {
		const user = users.find((u) => u.userId === filters.creator);
		tags.push({
			key: "creator",
			label: `Created by: ${user?.name ?? filters.creator}`,
		});
	}
	if (filters.createdAtFrom && filters.createdAtTo) {
		const start = new Date(filters.createdAtFrom).toLocaleDateString();
		const end = new Date(filters.createdAtTo).toLocaleDateString();
		tags.push({ key: "createdAt", label: `Created: ${start} - ${end}` });
	}
	for (const tag of filters.tags ?? []) {
		tags.push({ key: `tag:${tag}`, label: `Tag: ${tag}` });
	}

	return tags;
}

function removeTag(
	filters: FlagFiltersState,
	tagKey: string,
): FlagFiltersState {
	const next = { ...filters };
	if (tagKey.startsWith("status:")) {
		next.status = next.status?.filter((v) => `status:${v}` !== tagKey);
		if (next.status?.length === 0) next.status = undefined;
	} else if (tagKey.startsWith("flagType:")) {
		next.flagType = next.flagType?.filter((v) => `flagType:${v}` !== tagKey);
		if (next.flagType?.length === 0) next.flagType = undefined;
	} else if (tagKey.startsWith("visibility:")) {
		next.visibility = next.visibility?.filter(
			(v) => `visibility:${v}` !== tagKey,
		);
		if (next.visibility?.length === 0) next.visibility = undefined;
	} else if (tagKey.startsWith("isTemporary:")) {
		next.isTemporary = next.isTemporary?.filter(
			(v) => `isTemporary:${v}` !== tagKey,
		);
		if (next.isTemporary?.length === 0) next.isTemporary = undefined;
	} else if (tagKey.startsWith("tag:")) {
		next.tags = next.tags?.filter((t) => `tag:${t}` !== tagKey);
		if (next.tags?.length === 0) next.tags = undefined;
	} else if (tagKey === "creator") {
		next.creator = undefined;
	} else if (tagKey === "createdAt") {
		next.createdAtFrom = undefined;
		next.createdAtTo = undefined;
	}
	return next;
}
