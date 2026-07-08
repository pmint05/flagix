import { useState } from "react";
import {
	Button,
	ButtonGroup,
	Calendar,
	DateField,
	DatePicker,
	Input,
	ListBox,
	Select,
	Switch,
	Tag,
	TagGroup,
	TextArea,
	TextField,
	Tooltip,
} from "@heroui/react";
import { PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { parseDate } from "@internationalized/date";
import { OPERATORS_BY_TYPE, TYPE_OPTIONS } from "@/features/flags/editor/constants";

// ─── Condition Types ──────────────────────────────────────────────────────────

export type ConditionType = "custom" | "user" | "role";

/** The custom attribute clause (existing shape) */
export interface ConditionClause {
	conditionType: "custom";
	contextKey: string;
	type: "string" | "number" | "boolean" | "object" | "array" | "semver" | "date";
	operator: string;
	value?: any;
	values?: any[];
}

/** User targeting clause */
export interface UserConditionClause {
	conditionType: "user";
	userIds: string[];
}

/** Role targeting clause */
export interface RoleConditionClause {
	conditionType: "role";
	roles: string[];
}

export type SegmentCondition = ConditionClause | UserConditionClause | RoleConditionClause;

// ─── Default factories ────────────────────────────────────────────────────────

export function defaultCustomCondition(): ConditionClause {
	return {
		conditionType: "custom",
		contextKey: "",
		type: "string",
		operator: "is_one_of",
		values: [],
	};
}

export function defaultUserCondition(): UserConditionClause {
	return { conditionType: "user", userIds: [] };
}

export function defaultRoleCondition(): RoleConditionClause {
	return { conditionType: "role", roles: [] };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getCalendarDate = (dateStr: string | undefined) => {
	try {
		if (dateStr) {
			const cleanStr = dateStr.split("T")[0];
			return parseDate(cleanStr);
		}
	} catch {
		// ignore
	}
	return null;
};

export const NO_VALUE_OPERATORS = new Set(["is_empty", "is_not_empty"]);
export const MULTI_VALUE_OPERATORS = new Set([
	"is_one_of",
	"is_not_one_of",
	"contains_any",
	"contains_all",
]);

// ─── Condition type selector config — removed (label shown instead)

// ─── MultiValueInput ──────────────────────────────────────────────────────────

interface MultiValueInputProps {
	values: string[];
	onChange: (values: string[]) => void;
	placeholder?: string;
	type?: "string" | "number";
}

function MultiValueInput({ values, onChange, placeholder = "Press Enter to add", type = "string" }: MultiValueInputProps) {
	const [input, setInput] = useState("");

	const handleAdd = () => {
		const trimmed = input.trim();
		if (!trimmed) return;
		let val: any = trimmed;
		if (type === "number") {
			const parsed = Number(trimmed);
			if (isNaN(parsed)) return;
			val = parsed;
		}
		if (!values.includes(val)) {
			onChange([...values, val]);
		}
		setInput("");
	};

	const handleRemove = (keys: Set<any>) => {
		onChange(values.filter((_, idx) => !keys.has(idx)));
	};

	return (
		<div className="flex flex-col gap-2 w-full">
			{values.length > 0 && (
				<TagGroup selectionMode="none" onRemove={handleRemove}>
					<TagGroup.List items={values.map((v, i) => ({ id: i, label: String(v) }))}>
						{(item) => (
							<Tag key={item.id} id={item.id} textValue={item.label} size="sm">
								{item.label}
							</Tag>
						)}
					</TagGroup.List>
				</TagGroup>
			)}
			<ButtonGroup>
				<Input
					variant="secondary"
					aria-label="Add value"
					placeholder={placeholder}
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							e.preventDefault();
							handleAdd();
						}
					}}
					className="w-full rounded-r-none"
				/>
				<Button isIconOnly variant="tertiary" onPress={handleAdd}>
					<PlusIcon className="size-3.5" weight="bold" />
				</Button>
			</ButtonGroup>
		</div>
	);
}

// ─── DatePickerField ──────────────────────────────────────────────────────────

function DatePickerField({
	label,
	value,
	onChange,
}: {
	label: string;
	value: string | undefined;
	onChange: (val: string) => void;
}) {
	return (
		<DatePicker
			value={getCalendarDate(value)}
			onChange={(val) => onChange(val ? val.toString() : "")}
			className="max-w-[180px]">
			<DateField.Group fullWidth variant="secondary">
				<DateField.Input>
					{(segment) => <DateField.Segment segment={segment} />}
				</DateField.Input>
				<DateField.Suffix>
					<DatePicker.Trigger>
						<DatePicker.TriggerIndicator />
					</DatePicker.Trigger>
				</DateField.Suffix>
			</DateField.Group>
			<DatePicker.Popover>
				<Calendar aria-label={label}>
					<Calendar.Header>
						<Calendar.YearPickerTrigger>
							<Calendar.YearPickerTriggerHeading />
							<Calendar.YearPickerTriggerIndicator />
						</Calendar.YearPickerTrigger>
						<Calendar.NavButton slot="previous" />
						<Calendar.NavButton slot="next" />
					</Calendar.Header>
					<Calendar.Grid>
						<Calendar.GridHeader>
							{(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
						</Calendar.GridHeader>
						<Calendar.GridBody>
							{(date) => <Calendar.Cell date={date} />}
						</Calendar.GridBody>
					</Calendar.Grid>
				</Calendar>
			</DatePicker.Popover>
		</DatePicker>
	);
}

// ─── ValueInput (custom) ──────────────────────────────────────────────────────

function ValueInput({
	condition,
	index,
	onChange,
}: {
	condition: ConditionClause;
	index: number;
	onChange: (index: number, fields: Partial<ConditionClause>) => void;
}) {
	const { type, operator, value, values } = condition;

	if (NO_VALUE_OPERATORS.has(operator)) {
		return <div className="text-sm mt-2 text-default-500 italic">No value required</div>;
	}

	if (type === "boolean") {
		return (
			<div className="flex items-center gap-2 mt-1">
				<span className="text-sm">Value:</span>
				<Switch
					isSelected={value === true || value === "true"}
					onChange={(checked: boolean) => onChange(index, { value: checked })}>
					<Switch.Content>
						<Switch.Control>
							<Switch.Thumb />
						</Switch.Control>
						<span className="text-sm p-1 px-1.5 rounded-2xl bg-default">
							{value === true || value === "true" ? "True" : "False"}
						</span>
					</Switch.Content>
				</Switch>
			</div>
		);
	}

	if (type === "date" && operator === "between") {
		return (
			<div className="flex gap-2 items-center flex-wrap">
				<DatePickerField
					label="Start date"
					value={values?.[0]}
					onChange={(val) => onChange(index, { values: [val, values?.[1] ?? ""] })}
				/>
				<span className="text-xs text-muted-foreground shrink-0">to</span>
				<DatePickerField
					label="End date"
					value={values?.[1]}
					onChange={(val) => onChange(index, { values: [values?.[0] ?? "", val] })}
				/>
			</div>
		);
	}

	if (type === "date") {
		return (
			<DatePickerField
				label="Select date"
				value={value}
				onChange={(val) => onChange(index, { value: val })}
			/>
		);
	}

	if (type === "number" && operator === "between") {
		return (
			<div className="flex gap-2 items-center">
				<TextField variant="secondary" className="max-w-[140px]">
					<Input
						type="number"
						placeholder="Min"
						value={values?.[0] ?? ""}
						onChange={(e) =>
							onChange(index, { values: [e.target.value, values?.[1] ?? ""] })
						}
					/>
				</TextField>
				<span className="text-xs text-muted-foreground shrink-0">to</span>
				<TextField variant="secondary" className="max-w-[140px]">
					<Input
						type="number"
						placeholder="Max"
						value={values?.[1] ?? ""}
						onChange={(e) =>
							onChange(index, { values: [values?.[0] ?? "", e.target.value] })
						}
					/>
				</TextField>
			</div>
		);
	}

	if (type === "semver" && operator === "between") {
		return (
			<div className="flex gap-2 items-center">
				<TextField variant="secondary" className="max-w-[140px]">
					<Input
						placeholder="Min (e.g. 1.0.0)"
						value={values?.[0] ?? ""}
						onChange={(e) =>
							onChange(index, { values: [e.target.value, values?.[1] ?? ""] })
						}
					/>
				</TextField>
				<span className="text-xs text-muted-foreground shrink-0">to</span>
				<TextField variant="secondary" className="max-w-[140px]">
					<Input
						placeholder="Max (e.g. 2.0.0)"
						value={values?.[1] ?? ""}
						onChange={(e) =>
							onChange(index, { values: [values?.[0] ?? "", e.target.value] })
						}
					/>
				</TextField>
			</div>
		);
	}

	if (MULTI_VALUE_OPERATORS.has(operator)) {
		return (
			<MultiValueInput
				values={values || []}
				onChange={(vals) => onChange(index, { values: vals })}
				type={type === "number" ? "number" : "string"}
			/>
		);
	}

	if (operator === "equals_json") {
		return (
			<TextArea
				variant="secondary"
				placeholder='{"key": "value"}'
				value={value ?? ""}
				onChange={(e) => onChange(index, { value: e.target.value })}
				className="w-full font-mono text-xs"
				rows={2}
			/>
		);
	}

	return (
		<TextField variant="secondary">
			<Input
				placeholder={
					type === "number" ? "Enter number" : type === "semver" ? "e.g. 1.2.3" : "Enter value"
				}
				value={value ?? ""}
				onChange={(e) =>
					onChange(index, {
						value:
							type === "number"
								? e.target.value !== ""
									? Number(e.target.value)
									: ""
								: e.target.value,
					})
				}
				type={type === "number" ? "number" : "text"}
			/>
		</TextField>
	);
}

// ─── User Condition Block ─────────────────────────────────────────────────────

function UserConditionBlock({
	condition,
	index,
	onChange,
}: {
	condition: UserConditionClause;
	index: number;
	onChange: (index: number, updated: Partial<UserConditionClause>) => void;
}) {
	return (
		<div className="flex-1 min-w-0">
			<p className="text-xs text-muted-foreground mb-1.5">
				Match users whose <span className="font-medium text-foreground">User ID</span> is in this list:
			</p>
			<MultiValueInput
				values={condition.userIds}
				onChange={(vals) => onChange(index, { userIds: vals as string[] })}
				placeholder="Enter user ID or email, press Enter"
			/>
		</div>
	);
}

// ─── Role Condition Block ─────────────────────────────────────────────────────

function RoleConditionBlock({
	condition,
	index,
	onChange,
}: {
	condition: RoleConditionClause;
	index: number;
	onChange: (index: number, updated: Partial<RoleConditionClause>) => void;
}) {
	return (
		<div className="flex-1 min-w-0">
			<p className="text-xs text-muted-foreground mb-1.5">
				Match users whose <span className="font-medium text-foreground">Role</span> is in this list:
			</p>
			<MultiValueInput
				values={condition.roles}
				onChange={(vals) => onChange(index, { roles: vals as string[] })}
				placeholder="Enter role name, press Enter"
			/>
		</div>
	);
}

// ─── Main SegmentConditionContent ─────────────────────────────────────────────

interface SegmentConditionContentProps {
	index: number;
	condition: SegmentCondition;
	onChange: (index: number, updated: SegmentCondition) => void;
	onRemove: (index: number) => void;
	/** Display name e.g. "Custom Rule 1", "User Rule 1" */
	label?: string;
	/** between-validation error message */
	error?: string;
	showRemoveButton?: boolean;
}

export function SegmentConditionContent({
	index,
	condition,
	onChange,
	onRemove,
	label,
	error,
	showRemoveButton = true,
}: SegmentConditionContentProps) {
	const conditionType = condition.conditionType;

	// Handlers for custom condition changes
	const handleCustomChange = (_idx: number, fields: Partial<ConditionClause>) => {
		if (condition.conditionType !== "custom") return;
		const ops = fields.type ? OPERATORS_BY_TYPE[fields.type] : undefined;
		const updated: ConditionClause = {
			...condition,
			...fields,
			...(ops ? { operator: ops[0]?.key ?? condition.operator, value: undefined, values: [] } : {}),
		};
		// smart-clear value/values on operator change
		if (fields.operator && !fields.type) {
			const prevMulti = MULTI_VALUE_OPERATORS.has(condition.operator);
			const nextMulti = MULTI_VALUE_OPERATORS.has(fields.operator);
			const prevBetween = condition.operator === "between";
			const nextBetween = fields.operator === "between";
			if (prevMulti !== nextMulti || prevBetween !== nextBetween) {
				updated.value = undefined;
				updated.values = [];
			}
		}
		onChange(index, updated);
	};

	const handleUserChange = (_idx: number, fields: Partial<UserConditionClause>) => {
		if (condition.conditionType !== "user") return;
		onChange(index, { ...condition, ...fields });
	};

	const handleRoleChange = (_idx: number, fields: Partial<RoleConditionClause>) => {
		if (condition.conditionType !== "role") return;
		onChange(index, { ...condition, ...fields });
	};

	const ops = conditionType === "custom" ? (OPERATORS_BY_TYPE[(condition as ConditionClause).type] || []) : [];

	return (
		<div className="flex flex-col gap-3 p-4 rounded-3xl border border-divider bg-background shadow-sm">
			{/* ── Label + remove button row ── */}
			<div className="flex items-center justify-between gap-2">
				{label && (
					<span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
						{label}
					</span>
				)}

				{/* Remove button */}
				{showRemoveButton && (
					<Tooltip>
						<Tooltip.Trigger tabIndex={-1}>
							<Button
								excludeFromTabOrder
								isIconOnly
								variant="ghost"
								size="sm"
								onPress={() => onRemove(index)}
								className="hover:bg-danger/10 text-muted-foreground hover:text-danger"
								aria-label="Remove condition">
								<TrashIcon className="size-4" />
							</Button>
						</Tooltip.Trigger>
						<Tooltip.Content>Remove condition</Tooltip.Content>
					</Tooltip>
				)}
			</div>

			{/* ── Content area ── */}
			{conditionType === "custom" && (
				<div className="flex items-start gap-3 flex-wrap">
					{/* Context Key */}
					<div className="min-w-36 flex-1 max-w-xs">
						<TextField variant="secondary">
							<Input
								placeholder="Context key (e.g. user.email)"
								value={(condition as ConditionClause).contextKey}
								onChange={(e) => handleCustomChange(index, { contextKey: e.target.value })}
							/>
						</TextField>
					</div>

					{/* Type Select */}
					<div className="w-32 shrink-0">
						<Select
							variant="secondary"
							value={(condition as ConditionClause).type}
							onChange={(val) => handleCustomChange(index, { type: val as ConditionClause["type"] })}
							className="w-full">
							<Select.Trigger>
								<Select.Value />
								<Select.Indicator />
							</Select.Trigger>
							<Select.Popover>
								<ListBox>
									{TYPE_OPTIONS.map((opt) => (
										<ListBox.Item id={opt.key} key={opt.key} textValue={opt.label}>
											{opt.label}
										</ListBox.Item>
									))}
								</ListBox>
							</Select.Popover>
						</Select>
					</div>

					{/* Operator Select */}
					<div className="w-36 shrink-0">
						<Select
							variant="secondary"
							value={(condition as ConditionClause).operator}
							onChange={(val) => handleCustomChange(index, { operator: val as string })}
							className="w-full">
							<Select.Trigger>
								<Select.Value />
								<Select.Indicator />
							</Select.Trigger>
							<Select.Popover>
								<ListBox>
									{ops.map((op) => (
										<ListBox.Item id={op.key} key={op.key} textValue={op.label}>
											{op.label}
										</ListBox.Item>
									))}
								</ListBox>
							</Select.Popover>
						</Select>
					</div>

					{/* Value */}
					<div className="flex-1 min-w-48">
						<ValueInput
							condition={condition as ConditionClause}
							index={index}
							onChange={handleCustomChange}
						/>
					</div>

					{error && <p className="w-full text-xs text-danger">{error}</p>}
				</div>
			)}

			{conditionType === "user" && (
				<UserConditionBlock
					condition={condition as UserConditionClause}
					index={index}
					onChange={handleUserChange}
				/>
			)}

			{conditionType === "role" && (
				<RoleConditionBlock
					condition={condition as RoleConditionClause}
					index={index}
					onChange={handleRoleChange}
				/>
			)}
		</div>
	);
}
