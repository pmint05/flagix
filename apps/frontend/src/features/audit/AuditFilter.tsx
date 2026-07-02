import { type Key, useMemo, useState, useEffect, useRef } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import type { RangeValue } from "@react-types/shared";
import { CalendarDate, today, getLocalTimeZone } from "@internationalized/date";

import {
	DateField,
	DateRangePicker,
	Label,
	ListBox,
	ComboBox,
	Button,
	RangeCalendar,
	Input,
	SearchField,
	Popover,
	Autocomplete,
	Tag,
	TagGroup,
	useFilter,
} from "@heroui/react";
import {
	MagnifyingGlassIcon,
	FadersIcon,
	XIcon,
	CalendarBlankIcon,
} from "@phosphor-icons/react";
import { useContextStore } from "@/stores";
import { useOrganizationUsers } from "@/features/organizations/api";
import { useProjects } from "@/features/projects/api";
import { useProjectEnvironments } from "@/features/environments/api";
import UserAvatar from "#/components/user/user-avatar";

export interface AuditFilters {
	entityType?: string;
	actionType?: string;
	dateRange?: RangeValue<CalendarDate> | null;
	actorId?: string;
	actorEmail?: string;
	entityId?: string;
	projectId?: string;
	environmentId?: string;
}

interface AuditFilterProps {
	filters: AuditFilters;
	onChange: (filters: AuditFilters) => void;
}

const ENTITY_PREFIX_MAP: Record<string, string> = {
	organization: "ORG",
	project: "PROJECT",
	environment: "ENV",
	feature_flag: "FLAG",
	sdk_key: "SDK_KEY",
	member: "MBR",
};

const ENTITY_TYPES = [
	{ value: "all", label: "All Entities" },
	{ value: "organization", label: "Organization" },
	{ value: "project", label: "Project" },
	{ value: "environment", label: "Environment" },
	{ value: "feature_flag", label: "Feature Flag" },
	{ value: "sdk_key", label: "SDK Key" },
	{ value: "member", label: "Member" },
];

const ACTION_TYPES = [
	"ORG_CREATE",
	"ORG_UPDATE",
	"ORG_DELETE",
	"PROJECT_CREATE",
	"PROJECT_UPDATE",
	"PROJECT_DELETE",
	"ENV_CREATE",
	"ENV_UPDATE",
	"ENV_DELETE",
	"ENV_KEY_ROTATE",
	"FLAG_CREATE",
	"FLAG_UPDATE",
	"FLAG_DELETE",
	"FLAG_ACTIVATE",
	"FLAG_ARCHIVE",
	"FLAG_RESTORE",
	"FLAG_TOGGLE",
	"FLAG_RULE_UPDATE",
	"FLAG_VARIATION_UPDATE",
	"FLAG_VISIBILITY_UPDATE",
	"SDK_KEY_CREATE",
	"SDK_KEY_REVOKE",
	"SDK_KEY_ROTATE",
	"SDK_KEY_ENABLE",
	"SDK_KEY_DISABLE",
	"MBR_INVITE",
	"MBR_REMOVE",
	"MBR_ROLE_CHANGE",
];

const DATE_RANGE_PRESETS = [
	{ label: "Today", days: 0 },
	{ label: "Last 24 Hours", days: 1 },
	{ label: "Last 7 Days", days: 7 },
	{ label: "Last 30 Days", days: 30 },
];

export function AuditFilter({ filters, onChange }: AuditFilterProps) {
	const orgId = useContextStore((s) => s.selectedOrganization?.id);
	const { data: members = [] } = useOrganizationUsers(orgId || "");
	const { data: projects = [] } = useProjects();
	const { data: envs = [] } = useProjectEnvironments(filters.projectId);

	const [localEntityId, setLocalEntityId] = useState(filters.entityId ?? "");
	const debouncedEntityId = useDebounce(localEntityId, 500);

	const isMounted = useRef(false);

	useEffect(() => {
		if (!isMounted.current) {
			isMounted.current = true;
			return;
		}

		if ((debouncedEntityId || undefined) !== filters.entityId) {
			onChange({
				...filters,
				entityId: debouncedEntityId || undefined,
			});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [debouncedEntityId]);

	useEffect(() => {
		if (filters.entityId !== debouncedEntityId) {
			setLocalEntityId(filters.entityId ?? "");
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [filters.entityId]);

	const availableActions = useMemo(() => {
		let actions = ACTION_TYPES;
		if (filters.entityType && filters.entityType !== "all") {
			const prefix = ENTITY_PREFIX_MAP[filters.entityType];
			if (prefix) {
				actions = ACTION_TYPES.filter((a) => a.startsWith(prefix));
			}
		}
		return ["All Actions", ...actions];
	}, [filters.entityType]);

	const activeTags = useMemo(() => {
		const tags: Array<{ key: string; label: string }> = [];
		if (filters.projectId) {
			const p = projects.find((p) => p.id === filters.projectId);
			tags.push({
				key: "projectId",
				label: `Project: ${p?.name ?? filters.projectId}`,
			});
		}
		if (filters.environmentId) {
			const e = envs.find((e) => e.id === filters.environmentId);
			tags.push({
				key: "environmentId",
				label: `Environment: ${e?.name ?? filters.environmentId}`,
			});
		}
		if (filters.entityType && filters.entityType !== "all") {
			const o = ENTITY_TYPES.find((et) => et.value === filters.entityType);
			tags.push({
				key: "entityType",
				label: `Entity: ${o?.label ?? filters.entityType}`,
			});
		}
		if (filters.actionType) {
			tags.push({ key: "actionType", label: `Action: ${filters.actionType}` });
		}
		if (filters.actorId) {
			const m = members.find((member) => member.userId === filters.actorId);
			tags.push({
				key: "actorId",
				label: `Actor: ${m?.name || m?.email || filters.actorId}`,
			});
		}
		if (filters.dateRange) {
			const startStr = filters.dateRange.start.toString();
			const endStr = filters.dateRange.end.toString();
			tags.push({ key: "dateRange", label: `Date: ${startStr} - ${endStr}` });
		}
		return tags;
	}, [filters, projects, envs, members]);

	const handleRemoveTag = (key: string) => {
		const next = { ...filters };
		if (key === "projectId") {
			next.projectId = undefined;
			next.environmentId = undefined;
		} else if (key === "environmentId") {
			next.environmentId = undefined;
		} else if (key === "entityType") {
			next.entityType = undefined;
			next.actionType = undefined;
		} else if (key === "actionType") {
			next.actionType = undefined;
		} else if (key === "actorId") {
			next.actorId = undefined;
		} else if (key === "dateRange") {
			next.dateRange = null;
		}
		onChange(next);
	};

	const handleClearAll = () => {
		onChange({});
	};

	const selectedProject = projects.find((p) => p.id === filters.projectId);
	const selectedEnv = envs.find((e) => e.id === filters.environmentId);
	const selectedActor = members.find((m) => m.userId === filters.actorId);

	const tz = getLocalTimeZone();

	const handlePreset = (days: number) => {
		const end = today(tz);
		const start = end.subtract({ days });
		onChange({ ...filters, dateRange: { start, end } });
	};

	const { contains } = useFilter({ sensitivity: "base" });

	return (
		<div className="flex flex-col gap-3">
			<div className="flex flex-wrap items-center gap-2">
				{/* Entity ID Search */}
				<SearchField
					aria-label="Search Entity ID"
					className="w-full max-w-xs"
					value={localEntityId}
					onChange={setLocalEntityId}
					variant="secondary">
					<SearchField.Group>
						<SearchField.SearchIcon>
							<MagnifyingGlassIcon className="text-muted-foreground size-4" />
						</SearchField.SearchIcon>
						<SearchField.Input placeholder="Search Entity ID, Key or Slug..." />
						<SearchField.ClearButton />
					</SearchField.Group>
				</SearchField>

				{/* Filters Popover Trigger */}
				<Popover>
					<Popover.Trigger>
						<Button variant="secondary">
							<FadersIcon className="size-4" />
							Filters
						</Button>
					</Popover.Trigger>
					<Popover.Content className="w-80 sm:w-96" placement="bottom start">
						<Popover.Dialog>
							<Popover.Heading className="text-sm font-semibold">
								Filter Logs
							</Popover.Heading>
							<div className="mt-4 flex flex-col gap-4">
								{/* Project Selector */}
								<div className="flex flex-col gap-1.5">
									<Label className="text-xs font-medium text-muted-foreground">
										Project
									</Label>
									<Autocomplete
										variant="secondary"
										placeholder="Select Project"
										value={filters.projectId ?? null}
										onChange={(key) =>
											onChange({
												...filters,
												projectId: (key as string) || undefined,
												environmentId: undefined,
											})
										}>
										<Autocomplete.Trigger>
											<Autocomplete.Value>
												{({ isPlaceholder }) =>
													isPlaceholder || !selectedProject
														? "Select Project"
														: selectedProject.name
												}
											</Autocomplete.Value>
											<Autocomplete.ClearButton />
											<Autocomplete.Indicator />
										</Autocomplete.Trigger>
										<Autocomplete.Popover>
											<Autocomplete.Filter filter={contains}>
												<SearchField
													autoFocus
													name="search"
													variant="secondary">
													<SearchField.Group>
														<SearchField.SearchIcon />
														<SearchField.Input placeholder="Search Projects..." />
														<SearchField.ClearButton />
													</SearchField.Group>
												</SearchField>
												<ListBox>
													{projects.map((p) => (
														<ListBox.Item
															key={p.id}
															id={p.id}
															textValue={p.name}>
															{p.name}
															<ListBox.ItemIndicator />
														</ListBox.Item>
													))}
												</ListBox>
											</Autocomplete.Filter>
										</Autocomplete.Popover>
									</Autocomplete>
								</div>

								{/* Environment Selector */}
								<div className="flex flex-col gap-1.5">
									<Label className="text-xs font-medium text-muted-foreground">
										Environment
									</Label>
									<Autocomplete
										variant="secondary"
										placeholder={
											filters.projectId
												? "Select Environment"
												: "Choose Project first"
										}
										value={filters.environmentId ?? null}
										isDisabled={!filters.projectId}
										onChange={(key) =>
											onChange({
												...filters,
												environmentId: (key as string) || undefined,
											})
										}>
										<Autocomplete.Trigger>
											<Autocomplete.Value>
												{({ isPlaceholder }) =>
													isPlaceholder || !selectedEnv
														? "Select Environment"
														: selectedEnv.name
												}
											</Autocomplete.Value>
											<Autocomplete.ClearButton />
											<Autocomplete.Indicator />
										</Autocomplete.Trigger>
										<Autocomplete.Popover>
											<Autocomplete.Filter filter={contains}>
												<SearchField
													autoFocus
													name="search"
													variant="secondary">
													<SearchField.Group>
														<SearchField.SearchIcon />
														<SearchField.Input placeholder="Search Environments..." />
														<SearchField.ClearButton />
													</SearchField.Group>
												</SearchField>
												<ListBox>
													{envs.map((e) => (
														<ListBox.Item
															key={e.id}
															id={e.id}
															textValue={e.name}>
															{e.name}
															<ListBox.ItemIndicator />
														</ListBox.Item>
													))}
												</ListBox>
											</Autocomplete.Filter>
										</Autocomplete.Popover>
									</Autocomplete>
								</div>

								{/* Entity Type Selector */}
								<div className="flex flex-col gap-1.5">
									<Label className="text-xs font-medium text-muted-foreground">
										Entity Type
									</Label>
									<Autocomplete
										variant="secondary"
										placeholder="Select Entity Type"
										value={filters.entityType ?? "all"}
										onChange={(key: Key | null) => {
											const newEntity =
												key === "all" || key === null
													? undefined
													: (key as string);
											let newAction = filters.actionType;
											if (
												newEntity &&
												newAction &&
												newAction !== "All Actions"
											) {
												const prefix = ENTITY_PREFIX_MAP[newEntity];
												if (prefix && !newAction.startsWith(prefix)) {
													newAction = undefined;
												}
											}
											onChange({
												...filters,
												entityType: newEntity,
												actionType: newAction,
											});
										}}>
										<Autocomplete.Trigger>
											<Autocomplete.Value />
										</Autocomplete.Trigger>
										<Autocomplete.Popover>
											<Autocomplete.Filter filter={contains}>
												<SearchField
													autoFocus
													name="search"
													variant="secondary">
													<SearchField.Group>
														<SearchField.SearchIcon />
														<SearchField.Input placeholder="Search Entity Types..." />
														<SearchField.ClearButton />
													</SearchField.Group>
												</SearchField>
												<ListBox>
													{ENTITY_TYPES.map((type) => (
														<ListBox.Item
															key={type.value}
															id={type.value}
															textValue={type.label}>
															{type.label}
														</ListBox.Item>
													))}
												</ListBox>
											</Autocomplete.Filter>
										</Autocomplete.Popover>
									</Autocomplete>
								</div>

								{/* Action Type Selector */}
								<div className="flex flex-col gap-1.5">
									<Label className="text-xs font-medium text-muted-foreground">
										Action
									</Label>
									<Autocomplete
										variant="secondary"
										placeholder="Select Action"
										value={filters.actionType ?? "All Actions"}
										onChange={(key: Key | null) => {
											const newAction =
												key === "All Actions" || key === null
													? undefined
													: (key as string);
											onChange({ ...filters, actionType: newAction });
										}}>
										<Autocomplete.Trigger>
											<Autocomplete.Value />
										</Autocomplete.Trigger>
										<Autocomplete.Popover>
											<Autocomplete.Filter filter={contains}>
												<SearchField
													autoFocus
													name="search"
													variant="secondary">
													<SearchField.Group>
														<SearchField.SearchIcon />
														<SearchField.Input placeholder="Search Actions..." />
														<SearchField.ClearButton />
													</SearchField.Group>
												</SearchField>
												<ListBox>
													{availableActions.map((type) => (
														<ListBox.Item key={type} id={type} textValue={type}>
															{type}
														</ListBox.Item>
													))}
												</ListBox>
											</Autocomplete.Filter>
										</Autocomplete.Popover>
									</Autocomplete>
								</div>

								{/* Actor Selector */}
								<div className="flex flex-col gap-1.5">
									<Label className="text-xs font-medium text-muted-foreground">
										Actor
									</Label>
									<Autocomplete
										variant="secondary"
										value={filters.actorId ?? "all"}
										onChange={(key: Key | null) => {
											const newActorId =
												key === "all" || key === null
													? undefined
													: (key as string);
											onChange({ ...filters, actorId: newActorId });
										}}>
										<Autocomplete.Trigger>
											<Autocomplete.Value />
										</Autocomplete.Trigger>
										<Autocomplete.Popover>
											<Autocomplete.Filter filter={contains}>
												<SearchField
													autoFocus
													name="search"
													variant="secondary">
													<SearchField.Group>
														<SearchField.SearchIcon />
														<SearchField.Input placeholder="Search Actors..." />
														<SearchField.ClearButton />
													</SearchField.Group>
												</SearchField>
												<ListBox>
													<ListBox.Item
														key="all"
														id="all"
														textValue="All Actors">
														All Actors
													</ListBox.Item>
													{members.map((member) => (
														<ListBox.Item
															key={member.userId}
															id={member.userId}
															textValue={
																member.name || member.email || "Unknown"
															}>
															<div className="flex items-center gap-2">
																<UserAvatar
																	user={{
																		name: member.name || "Unknown",
																		email: member.email || "",
																	}}
																	size="sm"
																/>
																<div className="flex flex-col">
																	<span className="font-medium text-sm">
																		{member.name || "Unknown"}
																	</span>
																	{member.email && (
																		<span className="text-xs text-default-400 font-mono">
																			{member.email}
																		</span>
																	)}
																</div>
															</div>
														</ListBox.Item>
													))}
												</ListBox>
											</Autocomplete.Filter>
										</Autocomplete.Popover>
									</Autocomplete>
								</div>
							</div>
						</Popover.Dialog>
					</Popover.Content>
				</Popover>

				{/* Date Range Picker */}
				<div className="w-full sm:w-80 max-w-xs">
					<DateRangePicker
						aria-label="Date Range Picker"
						value={filters.dateRange ?? null}
						onChange={(range) => onChange({ ...filters, dateRange: range })}>
						<DateField.Group variant="secondary" fullWidth>
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
							<div className="flex flex-col sm:flex-row">
								<div className="flex flex-col gap-2 pr-2 sm:border-r border-default-200">
									<span className="text-sm font-medium text-foreground mb-1">
										Presets
									</span>
									{DATE_RANGE_PRESETS.map((preset) => (
										<Button
											key={preset.label}
											size="sm"
											variant="outline"
											className="justify-start"
											onPress={() => handlePreset(preset.days)}>
											{preset.label}
										</Button>
									))}
									<Button
										size="sm"
										variant="ghost"
										className="justify-center mt-auto hover:text-danger hover:bg-danger-soft transition"
										fullWidth
										onPress={() => onChange({ ...filters, dateRange: null })}>
										Clear Range
									</Button>
								</div>
								<RangeCalendar aria-label="Date Range" className="p-2">
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
									<RangeCalendar.YearPickerGrid>
										<RangeCalendar.YearPickerGridBody>
											{({ year }) => (
												<RangeCalendar.YearPickerCell year={year} />
											)}
										</RangeCalendar.YearPickerGridBody>
									</RangeCalendar.YearPickerGrid>
								</RangeCalendar>
							</div>
						</DateRangePicker.Popover>
					</DateRangePicker>
				</div>
			</div>

			{/* Active Tags list */}
			{activeTags.length > 0 && (
				<div className="flex flex-wrap items-center gap-2 mt-1">
					<TagGroup
						selectionMode="none"
						onRemove={(keys) => {
							const removed = Array.from(keys) as string[];
							removed.forEach((k) => handleRemoveTag(k));
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
						onPress={handleClearAll}
						className="text-muted-foreground text-xs h-7 px-2">
						Clear all
					</Button>
				</div>
			)}
		</div>
	);
}
