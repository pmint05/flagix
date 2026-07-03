import { Button, DateField, DateRangePicker, RangeCalendar } from "@heroui/react";
import { CalendarBlankIcon } from "@phosphor-icons/react";
import type { RangeValue } from "@react-types/shared";
import { CalendarDate, today, getLocalTimeZone } from "@internationalized/date";

const DATE_RANGE_PRESETS: Array<{
  label: string;
  days: number;
}> = [
  { label: "Today", days: 0 },
  { label: "Last 24 Hours", days: 1 },
  { label: "Last 7 Days", days: 7 },
  { label: "Last 30 Days", days: 30 },
  { label: "Last 90 Days", days: 90 },
];

interface DateRangeFilterProps {
  value: RangeValue<CalendarDate> | null;
  onChange: (range: RangeValue<CalendarDate> | null) => void;
  label?: string;
}

export function DateRangeFilter({ value, onChange, label = "Date Range" }: DateRangeFilterProps) {
  const tz = getLocalTimeZone();

  const handlePreset = (days: number) => {
    const start = today(tz).subtract({ days });
    const end = today(tz);
    onChange({ start, end });
  };

  const handleClear = () => {
    onChange(null);
  };

  return (
    <DateRangePicker
      aria-label={label}
      value={value}
      onChange={(range) => onChange(range)}
    >
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
          <div className="flex flex-col gap-2 pr-2 sm:border-r border-default-200 min-w-35">
            <span className="text-sm font-medium text-foreground mb-1">Presets</span>
            {DATE_RANGE_PRESETS.map((preset) => (
              <Button
                key={preset.label}
                size="sm"
                variant="outline"
                className="justify-start"
                onPress={() => handlePreset(preset.days)}
              >
                {preset.label}
              </Button>
            ))}
            <Button
              size="sm"
              variant="ghost"
              className="justify-center mt-auto hover:text-danger hover:bg-danger-soft transition"
              onPress={handleClear}
            >
              Clear Range
            </Button>
          </div>
          <RangeCalendar aria-label={label} className="p-2">
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
                {(day) => <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>}
              </RangeCalendar.GridHeader>
              <RangeCalendar.GridBody>
                {(date) => <RangeCalendar.Cell date={date} />}
              </RangeCalendar.GridBody>
            </RangeCalendar.Grid>
            <RangeCalendar.YearPickerGrid>
              <RangeCalendar.YearPickerGridBody>
                {({ year }) => <RangeCalendar.YearPickerCell year={year} />}
              </RangeCalendar.YearPickerGridBody>
            </RangeCalendar.YearPickerGrid>
          </RangeCalendar>
        </div>
      </DateRangePicker.Popover>
    </DateRangePicker>
  );
}
