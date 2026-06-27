import type { Key } from "@heroui/react";
import type { RangeValue } from "@react-types/shared";
import type { CalendarDate } from "@internationalized/date";

import {
	DateField,
	DateRangePicker,
	Label,
	ListBox,
	Select,
} from "@heroui/react";
import { RangeCalendar } from "@heroui/react";

export interface AuditFilters {
	entityType?: string;
	actionType?: string;
	dateRange?: RangeValue<CalendarDate> | null;
}

interface AuditFilterProps {
	filters: AuditFilters;
	onChange: (filters: AuditFilters) => void;
}

const ENTITY_TYPES = [
	{ value: "organization", label: "Organization" },
	{ value: "project", label: "Project" },
	{ value: "environment", label: "Environment" },
	{ value: "feature_flag", label: "Feature Flag" },
	{ value: "targeting_rule", label: "Targeting Rule" },
	{ value: "variation", label: "Variation" },
	{ value: "sdk_key", label: "SDK Key" },
];

const ACTION_TYPES = [
	{ value: "create", label: "Create" },
	{ value: "update", label: "Update" },
	{ value: "delete", label: "Delete" },
	{ value: "archive", label: "Archive" },
	{ value: "restore", label: "Restore" },
	{ value: "toggle", label: "Toggle Status" },
];

export function AuditFilter({ filters, onChange }: AuditFilterProps) {
	return (
		<div className="flex flex-col gap-4 sm:flex-row sm:items-end w-full">
			<div className="w-full sm:w-48">
				<Select
					placeholder="Any entity"
					value={filters.entityType ?? null}
					onChange={(key: Key | null) =>
						onChange({ ...filters, entityType: (key as string) ?? undefined })
					}>
					<Label>Entity Type</Label>
					<Select.Trigger>
						<Select.Value />
						<Select.Indicator />
					</Select.Trigger>
					<Select.Popover>
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
					</Select.Popover>
				</Select>
			</div>

			<div className="w-full sm:w-48">
				<Select
					placeholder="Any action"
					value={filters.actionType ?? null}
					onChange={(key: Key | null) =>
						onChange({ ...filters, actionType: (key as string) ?? undefined })
					}>
					<Label>Action</Label>
					<Select.Trigger>
						<Select.Value />
						<Select.Indicator />
					</Select.Trigger>
					<Select.Popover>
						<ListBox>
							{ACTION_TYPES.map((type) => (
								<ListBox.Item
									key={type.value}
									id={type.value}
									textValue={type.label}>
									{type.label}
								</ListBox.Item>
							))}
						</ListBox>
					</Select.Popover>
				</Select>
			</div>

			<div className="w-full sm:w-64">
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
						<RangeCalendar aria-label="Date Range">
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
										<RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>
									)}
								</RangeCalendar.GridHeader>
								<RangeCalendar.GridBody>
									{(date) => <RangeCalendar.Cell date={date} />}
								</RangeCalendar.GridBody>
							</RangeCalendar.Grid>
						</RangeCalendar>
					</DateRangePicker.Popover>
				</DateRangePicker>
			</div>
		</div>
	);
}
