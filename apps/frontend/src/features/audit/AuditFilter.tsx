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
} from "@heroui/react";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";

export interface AuditFilters {
	entityType?: string;
	actionType?: string;
	dateRange?: RangeValue<CalendarDate> | null;
	actorEmail?: string;
	entityId?: string;
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
	targeting_rule: "RULE",
	variation: "VARIATION",
	sdk_key: "SDK_KEY",
	member: "MBR",
};

const ENTITY_TYPES = [
	{ value: "all", label: "All Entities" },
	{ value: "organization", label: "Organization" },
	{ value: "project", label: "Project" },
	{ value: "environment", label: "Environment" },
	{ value: "feature_flag", label: "Feature Flag" },
	{ value: "targeting_rule", label: "Targeting Rule" },
	{ value: "variation", label: "Variation" },
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
	"FLAG_TOGGLE",
	"RULE_CREATE",
	"RULE_UPDATE",
	"RULE_DELETE",
	"RULE_REORDER",
	"RULE_TOGGLE",
	"VARIATION_CREATE",
	"VARIATION_UPDATE",
	"VARIATION_DELETE",
	"SDK_KEY_CREATE",
	"SDK_KEY_REVOKE",
	"SDK_KEY_ROTATE",
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
	const [localActorEmail, setLocalActorEmail] = useState(
		filters.actorEmail ?? "",
	);
	const [localEntityId, setLocalEntityId] = useState(filters.entityId ?? "");

	const debouncedActorEmail = useDebounce(localActorEmail, 500);
	const debouncedEntityId = useDebounce(localEntityId, 500);

	const isMounted = useRef(false);

	useEffect(() => {
		if (!isMounted.current) {
			isMounted.current = true;
			return;
		}

		if (
			(debouncedActorEmail || undefined) !== filters.actorEmail ||
			(debouncedEntityId || undefined) !== filters.entityId
		) {
			onChange({
				...filters,
				actorEmail: debouncedActorEmail || undefined,
				entityId: debouncedEntityId || undefined,
			});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [debouncedActorEmail, debouncedEntityId]);

	useEffect(() => {
		if (filters.actorEmail !== debouncedActorEmail) {
			setLocalActorEmail(filters.actorEmail ?? "");
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [filters.actorEmail]);

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

	const tz = getLocalTimeZone();

	const handlePreset = (days: number) => {
		const end = today(tz);
		const start = end.subtract({ days });
		onChange({ ...filters, dateRange: { start, end } });
	};

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-4 sm:flex-row w-full">
				<SearchField aria-label="Search actor" className="">
					<Label>Actor</Label>
					<SearchField.Group>
						<SearchField.SearchIcon>
							<MagnifyingGlassIcon className="text-muted-foreground" />
						</SearchField.SearchIcon>
						<SearchField.Input
							placeholder="Search actor email..."
							value={localActorEmail}
							onChange={(e) => setLocalActorEmail(e.target.value)}
						/>
						{localActorEmail && (
							<SearchField.ClearButton onPress={() => setLocalActorEmail("")} />
						)}
					</SearchField.Group>
				</SearchField>

				<SearchField aria-label="Search entity ID" className="">
					<Label>Target Entity ID</Label>
					<SearchField.Group>
						<SearchField.SearchIcon>
							<MagnifyingGlassIcon className="text-muted-foreground" />
						</SearchField.SearchIcon>
						<SearchField.Input
							value={localEntityId}
							onChange={(e) => setLocalEntityId(e.target.value)}
							placeholder="Search exact entity ID..."
						/>
						{localEntityId && (
							<SearchField.ClearButton onPress={() => setLocalEntityId("")} />
						)}
					</SearchField.Group>
				</SearchField>
			</div>

			<div className="flex flex-col gap-4 sm:flex-row sm:items-end w-full">
				<div className="w-full sm:w-56">
					<ComboBox
						value={filters.entityType ?? "all"}
						onChange={(key: Key | null) => {
							const newEntity =
								key === "all" || key === null ? undefined : (key as string);
							let newAction = filters.actionType;
							if (newEntity && newAction && newAction !== "All Actions") {
								const prefix = ENTITY_PREFIX_MAP[newEntity];
								if (prefix && !newAction.startsWith(prefix)) {
									newAction = undefined; // clear invalid action
								}
							}
							onChange({
								...filters,
								entityType: newEntity,
								actionType: newAction,
							});
						}}>
						<Label>Entity Type</Label>
						<ComboBox.InputGroup>
							<Input placeholder="Any entity" />
						</ComboBox.InputGroup>
						<ComboBox.Popover>
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
						</ComboBox.Popover>
					</ComboBox>
				</div>

				<div className="w-full sm:w-64">
					<ComboBox
						value={filters.actionType ?? "All Actions"}
						onChange={(key: Key | null) => {
							const newAction =
								key === "All Actions" || key === null
									? undefined
									: (key as string);
							onChange({ ...filters, actionType: newAction });
						}}>
						<Label>Action</Label>
						<ComboBox.InputGroup>
							<Input placeholder="Any action" />
						</ComboBox.InputGroup>
						<ComboBox.Popover>
							<ListBox>
								{availableActions.map((type) => (
									<ListBox.Item key={type} id={type} textValue={type}>
										{type}
									</ListBox.Item>
								))}
							</ListBox>
						</ComboBox.Popover>
					</ComboBox>
				</div>

				<div className="w-full sm:w-80 flex-1 max-w-md">
					<DateRangePicker
						value={filters.dateRange ?? null}
						onChange={(range) => onChange({ ...filters, dateRange: range })}>
						<Label>Date Range</Label>
						<DateField.Group fullWidth>
							<DateField.Input slot="start">
								{(segment) => <DateField.Segment segment={segment} />}
							</DateField.Input>
							<DateRangePicker.RangeSeparator />
							<DateField.Input slot="end">
								{(segment) => <DateField.Segment segment={segment} />}
							</DateField.Input>
							<DateField.Suffix>
								<DateRangePicker.Trigger>
									<DateRangePicker.TriggerIndicator />
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
		</div>
	);
}
