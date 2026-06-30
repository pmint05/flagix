"use client";
import { useState, useEffect } from "react";
import type { Key } from "@heroui/react";
import { Controller, useFormContext, useFieldArray, useWatch } from "react-hook-form";
import {
	Button,
	Input,
	Select,
	TagGroup,
	Tag,
	ListBox,
	ButtonGroup,
	TextField,
	InputGroup,
	Tooltip,
	TextArea,
	Switch,
	FieldError,
} from "@heroui/react";
import {
	PlusIcon,
	TrashIcon,
	InfoIcon,
	ArrowRightIcon,
} from "@phosphor-icons/react";
import type { FeatureFlag } from "@/types/feature-flag";
import type { FlagEditorFormValues } from "../../schema";
import { VariationSelector } from "../VariationSelector";
import { TYPE_OPTIONS, OPERATORS_BY_TYPE } from "../../constants";

interface CustomRuleContentProps {
	flag: FeatureFlag;
	ruleIndex: number;
}

const getValuesErrorMessage = (err: any) => {
	if (!err) return null;
	if (err.message) return err.message;
	const firstItemErr = Object.values(err).find((e: any) => e?.message) as any;
	return firstItemErr?.message || null;
};

// Local-state inputs to prevent typing lag
function ContextKeyInput({
	value,
	onChange,
	placeholder,
	isInvalid,
	error,
}: {
	value: string;
	onChange: (v: string) => void;
	placeholder: string;
	isInvalid: boolean;
	error: any;
}) {
	const [localVal, setLocalVal] = useState(value || "");

	useEffect(() => {
		setLocalVal(value || "");
	}, [value]);

	return (
		<TextField variant="secondary" isInvalid={isInvalid}>
			<InputGroup>
				<InputGroup.Input
					placeholder={placeholder}
					value={localVal}
					onChange={(e) => setLocalVal(e.target.value)}
					onBlur={() => {
						if (localVal !== value) {
							onChange(localVal);
						}
					}}
					className="w-full"
				/>
			</InputGroup>
			{error && <FieldError>{error.message}</FieldError>}
		</TextField>
	);
}

function ConditionValueInput({
	value,
	onChange,
	type,
	placeholder,
	isInvalid,
	error,
}: {
	value: any;
	onChange: (v: any) => void;
	type: string;
	placeholder: string;
	isInvalid: boolean;
	error: any;
}) {
	const [localVal, setLocalVal] = useState(value !== undefined ? String(value) : "");

	useEffect(() => {
		setLocalVal(value !== undefined ? String(value) : "");
	}, [value]);

	return (
		<TextField variant="secondary" isInvalid={isInvalid}>
			<InputGroup>
				<InputGroup.Input
					type={type}
					placeholder={placeholder}
					value={localVal}
					onChange={(e) => setLocalVal(e.target.value)}
					onBlur={() => {
						const finalVal =
							type === "number"
								? localVal !== ""
									? Number(localVal)
									: ""
								: localVal;
						if (finalVal !== value) {
							onChange(finalVal);
						}
					}}
					className="w-full"
				/>
			</InputGroup>
			{error && <FieldError>{error.message}</FieldError>}
		</TextField>
	);
}

function JsonValueTextArea({
	value,
	onChange,
	placeholder,
	error,
}: {
	value: string;
	onChange: (v: string) => void;
	placeholder: string;
	error: any;
}) {
	const [localVal, setLocalVal] = useState(value || "");

	useEffect(() => {
		setLocalVal(value || "");
	}, [value]);

	return (
		<div className="flex flex-col gap-1 w-full">
			<TextArea
				variant="secondary"
				placeholder={placeholder}
				value={localVal}
				onChange={(e) => setLocalVal(e.target.value)}
				onBlur={() => {
					if (localVal !== value) {
						onChange(localVal);
					}
				}}
				className="w-full font-mono"
			/>
			{error && (
				<FieldError className="text-xs text-danger">
					{error.message}
				</FieldError>
			)}
		</div>
	);
}

interface ConditionRowProps {
	fieldId: string;
	idx: number;
	ruleIndex: number;
	control: any;
	setValue: any;
	errors: any;
	remove: (index: number) => void;
	fieldsLength: number;
}

function ConditionRow({
	fieldId,
	idx,
	ruleIndex,
	control,
	setValue,
	errors,
	remove,
	fieldsLength,
}: ConditionRowProps) {
	const condType = (useWatch({
		name: `rules.${ruleIndex}.conditions.conditions.${idx}.type` as any,
		control,
	}) as any) || "string";

	const condOperator = (useWatch({
		name: `rules.${ruleIndex}.conditions.conditions.${idx}.operator` as any,
		control,
	}) as any) || "";

	const validOperators = OPERATORS_BY_TYPE[condType] || [];
	const condErrors = (errors?.rules as any)?.[ruleIndex]?.conditions?.conditions?.[idx];

	return (
		<div
			key={fieldId}
			className="flex items-start gap-4 flex-wrap p-4 rounded-3xl border">
			{/* Context Key */}
			<div className="min-w-36 flex-1 max-w-xs">
				<Controller
					name={`rules.${ruleIndex}.conditions.conditions.${idx}.contextKey` as any}
					control={control}
					render={({ field: keyField }) => (
						<ContextKeyInput
							value={keyField.value || ""}
							onChange={keyField.onChange}
							placeholder="Context key (e.g. user.email)"
							isInvalid={!!condErrors?.contextKey}
							error={condErrors?.contextKey}
						/>
					)}
				/>
			</div>

			{/* Type Select */}
			<div className="w-36 shrink-0">
				<Controller
					name={`rules.${ruleIndex}.conditions.conditions.${idx}.type` as any}
					control={control}
					render={({ field: typeField }) => (
						<Select
							variant="secondary"
							placeholder="Type"
							value={typeField.value}
							onChange={(val) => {
								typeField.onChange(val);
								// Automatically pick the first valid operator when type changes
								const ops = OPERATORS_BY_TYPE[val as string] || [];
								setValue(
									`rules.${ruleIndex}.conditions.conditions.${idx}.operator` as any,
									ops[0]?.key || "",
								);
								setValue(
									`rules.${ruleIndex}.conditions.conditions.${idx}.values` as any,
									[],
								);
								setValue(
									`rules.${ruleIndex}.conditions.conditions.${idx}.value` as any,
									"",
								);
							}}
							className="w-full">
							<Select.Trigger>
								<Select.Value />
								<Select.Indicator />
							</Select.Trigger>
							<Select.Popover>
								<ListBox>
									{TYPE_OPTIONS.map((opt) => (
										<ListBox.Item
											key={opt.key}
											id={opt.key}
											textValue={opt.label}>
											{opt.label}
										</ListBox.Item>
									))}
								</ListBox>
							</Select.Popover>
						</Select>
					)}
				/>
			</div>

			{/* Operator Select */}
			<div className="w-40 shrink-0">
				<Controller
					name={`rules.${ruleIndex}.conditions.conditions.${idx}.operator` as any}
					control={control}
					render={({ field: opField }) => (
						<Select
							variant="secondary"
							placeholder="Operator"
							value={opField.value}
							onChange={(val) => {
								const prevOp = opField.value as string;
								const nextOp = val as string;

								opField.onChange(val);

								const MULTI_VALUE_OPERATORS = [
									"is_one_of",
									"is_not_one_of",
								];
								const NO_VALUE_OPERATORS = ["is_empty", "is_not_empty"];

								const isPrevMulti = MULTI_VALUE_OPERATORS.includes(prevOp);
								const isNextMulti = MULTI_VALUE_OPERATORS.includes(nextOp);

								const isPrevNoVal = NO_VALUE_OPERATORS.includes(prevOp);
								const isNextNoVal = NO_VALUE_OPERATORS.includes(nextOp);

								if (
									isPrevMulti !== isNextMulti ||
									isPrevNoVal !== isNextNoVal
								) {
									setValue(
										`rules.${ruleIndex}.conditions.conditions.${idx}.values` as any,
										[],
									);
									setValue(
										`rules.${ruleIndex}.conditions.conditions.${idx}.value` as any,
										"",
									);
								}
							}}
							className="w-full">
							<Select.Trigger>
								<Select.Value />
								<Select.Indicator />
							</Select.Trigger>
							<Select.Popover>
								<ListBox>
									{validOperators.map((opt) => (
										<ListBox.Item
											key={opt.key}
											id={opt.key}
											textValue={opt.label}>
											{opt.label}
										</ListBox.Item>
									))}
								</ListBox>
							</Select.Popover>
						</Select>
					)}
				/>
			</div>

			{/* Value / Values Input */}
			<div className="flex-1 min-w-48">
				{(() => {
					if (
						condOperator === "is_empty" ||
						condOperator === "is_not_empty"
					) {
						return (
							<div className="text-sm mt-2 text-default-500">No value required</div>
						);
					}

					if (
						condOperator === "is_one_of" ||
						condOperator === "is_not_one_of"
					) {
						return (
							<Controller
								name={`rules.${ruleIndex}.conditions.conditions.${idx}.values` as any}
								control={control}
								render={({ field: valuesField }) => (
									<div className="flex flex-col gap-1">
										<MultiValueInput
											values={valuesField.value || []}
											onChange={valuesField.onChange}
											type={condType === "number" ? "number" : "string"}
										/>
										{getValuesErrorMessage(condErrors?.values) && (
											<FieldError className="text-xs text-danger">
												{getValuesErrorMessage(condErrors.values)}
											</FieldError>
										)}
									</div>
								)}
							/>
						);
					}

					if (condType === "boolean") {
						return (
							<Controller
								name={`rules.${ruleIndex}.conditions.conditions.${idx}.value` as any}
								control={control}
								render={({ field: valField }) => (
									<div className="flex items-center gap-2 mt-1">
										<span className="text-sm">Value:</span>
										<Switch
											isSelected={
												valField.value === true ||
												valField.value === "true"
											}
											onChange={(checked: boolean) =>
												valField.onChange(checked)
											}>
											<Switch.Content>
												<Switch.Control>
													<Switch.Thumb />
												</Switch.Control>
												<span className="text-sm p-1 px-1.5 rounded-2xl bg-default">
													{valField.value === true ||
													valField.value === "true"
														? "True"
														: "False"}
												</span>
											</Switch.Content>
										</Switch>
									</div>
								)}
							/>
						);
					}

					if (condOperator === "equals_json") {
						return (
							<Controller
								name={`rules.${ruleIndex}.conditions.conditions.${idx}.value` as any}
								control={control}
								render={({ field: valField }) => (
									<JsonValueTextArea
										value={valField.value || ""}
										onChange={valField.onChange}
										placeholder='{"key": "value"}'
										error={condErrors?.value}
									/>
								)}
							/>
						);
					}

					return (
						<Controller
							name={`rules.${ruleIndex}.conditions.conditions.${idx}.value` as any}
							control={control}
							render={({ field: valField }) => (
								<ConditionValueInput
									value={valField.value}
									onChange={valField.onChange}
									type={condType === "number" ? "number" : "text"}
									placeholder="Enter value"
									isInvalid={!!condErrors?.value}
									error={condErrors?.value}
								/>
							)}
						/>
					);
				})()}
			</div>

			{fieldsLength > 1 && (
				<Tooltip>
					<Tooltip.Trigger tabIndex={-1}>
						<Button
							excludeFromTabOrder
							isIconOnly
							variant="ghost"
							size="sm"
							onPress={() => remove(idx)}
							className="mt-1 hover:bg-danger/10 text-danger hover:text-danger">
							<TrashIcon className="size-4" />
						</Button>
					</Tooltip.Trigger>
					<Tooltip.Content>Remove condition</Tooltip.Content>
				</Tooltip>
			)}
		</div>
	);
}

export function CustomRuleContent({ flag, ruleIndex }: CustomRuleContentProps) {
	const {
		control,
		setValue,
		formState: { errors },
	} = useFormContext<FlagEditorFormValues>();

	const { fields, append, remove } = useFieldArray({
		control,
		name: `rules.${ruleIndex}.conditions.conditions` as any,
	});

	const handleAddCondition = () => {
		append({
			contextKey: "",
			type: "string",
			operator: "is_one_of",
			values: [],
			value: "",
		});
	};

	return (
		<div className="space-y-4">
			<div className="space-y-3">
				<div className="text-sm font-semibold mb-2">
					IF all conditions match:
				</div>

				{fields.length > 0 && (
					<div className="hidden md:flex items-center gap-4 p-4 pl-5 py-1.5 pb-0 text-[10px] font-bold uppercase tracking-wider border border-transparent">
						<div className="min-w-36 flex-1 max-w-xs flex items-center gap-1">
							<span>Context Key</span>
							<Tooltip delay={0} closeDelay={0}>
								<Tooltip.Trigger>
									<InfoIcon className="size-3.5 relative -top-px" />
								</Tooltip.Trigger>
								<Tooltip.Content className={"w-fit max-w-fit"}>
									<div className="max-w-xs p-1.5 space-y-1">
										<p className="font-semibold text-foreground">
											Context Key Notation
										</p>
										<p className="break-normal">
											Supports dot-notation to match properties of nested
											objects.
										</p>
										<div className="flex items-center gap-1 whitespace-nowrap">
											<p className="font-mono p-1 rounded-xl bg-default w-fit">
												user.email
											</p>
											<ArrowRightIcon />
											<p className="font-mono p-1 rounded-xl bg-default w-fit">
												attributes.user.email
											</p>
										</div>
										<p className="break-normal">
											To use a literal dot in the key, escape it with a
											backslash:
										</p>
										<div className="flex items-center gap-1 whitespace-nowrap">
											<p className="font-mono p-1 rounded bg-default w-fit">
												region\.code
											</p>
											<ArrowRightIcon />
											<p className="font-mono p-1 rounded bg-default w-fit">
												attributes["region.code"]
											</p>
										</div>
									</div>
								</Tooltip.Content>
							</Tooltip>
						</div>
						<div className="w-36 shrink-0">Type</div>
						<div className="w-40 shrink-0">Operator</div>
						<div className="flex-1 min-w-48">Value</div>
						{fields.length > 1 && <div className="w-8 shrink-0" />}
					</div>
				)}

				{fields.map((field, idx) => (
					<ConditionRow
						key={field.id}
						fieldId={field.id}
						idx={idx}
						ruleIndex={ruleIndex}
						control={control}
						setValue={setValue}
						errors={errors}
						remove={remove}
						fieldsLength={fields.length}
					/>
				))}
			</div>

			<Button size="sm" variant="outline" onPress={handleAddCondition}>
				<PlusIcon className="size-4 mr-1.5" weight="bold" />
				Add Condition
			</Button>

			<div className="flex items-center gap-2 pl-4 pt-2 border-t border-divider/50">
				<span className="text-sm font-semibold ">then resolve</span>
				<VariationSelector
					flag={flag}
					name={`rules.${ruleIndex}.variationId`}
				/>
			</div>
		</div>
	);
}

interface MultiValueInputProps {
	values: any[];
	onChange: (values: any[]) => void;
	type: "string" | "number";
}

function MultiValueInput({ values, onChange, type }: MultiValueInputProps) {
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

	const handleRemove = (keys: Set<Key>) => {
		const newVals = values.filter((_, idx) => !keys.has(idx));
		onChange(newVals);
	};

	return (
		<div className="flex flex-col gap-2 min-w-48 max-w-xs">
			{values.length > 0 && (
				<TagGroup selectionMode="none" onRemove={handleRemove}>
					<TagGroup.List
						items={values.map((v, i) => ({ id: i, label: String(v) }))}>
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
					placeholder={type === "number" ? "Enter number" : "Enter text"}
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
