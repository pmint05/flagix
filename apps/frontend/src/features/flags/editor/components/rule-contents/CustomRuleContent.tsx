"use client";
import { useState } from "react";
import type { Key } from "@heroui/react";
import { Controller, useFormContext, useFieldArray } from "react-hook-form";
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
} from "@heroui/react";
import { PlusIcon, TrashIcon } from "@phosphor-icons/react";
import type { FeatureFlag } from "@/types/feature-flag";
import type { FlagEditorFormValues } from "../../schema";
import { VariationSelector } from "../VariationSelector";

interface CustomRuleContentProps {
	flag: FeatureFlag;
	ruleIndex: number;
}

const TYPE_OPTIONS = [
	{ key: "string", label: "String" },
	{ key: "number", label: "Number" },
	{ key: "boolean", label: "Boolean" },
	{ key: "object", label: "Object (JSON)" },
	{ key: "array", label: "Array" },
];

const OPERATORS_BY_TYPE: Record<string, { key: string; label: string }[]> = {
	string: [
		{ key: "is_one_of", label: "Is one of" },
		{ key: "is_not_one_of", label: "Is not one of" },
		{ key: "contains", label: "Contains" },
		{ key: "not_contains", label: "Does not contain" },
		{ key: "starts_with", label: "Starts with" },
		{ key: "ends_with", label: "Ends with" },
		{ key: "matches_regex", label: "Matches regex" },
	],
	number: [
		{ key: "equals", label: "=" },
		{ key: "not_equals", label: "≠" },
		{ key: "gt", label: ">" },
		{ key: "gte", label: ">=" },
		{ key: "lt", label: "<" },
		{ key: "lte", label: "<=" },
		{ key: "is_one_of", label: "Is one of" },
		{ key: "is_not_one_of", label: "Is not one of" },
	],
	boolean: [
		{ key: "equals", label: "Is" },
		{ key: "not_equals", label: "Is not" },
	],
	object: [
		{ key: "has_key", label: "Has key" },
		{ key: "not_has_key", label: "Does not have key" },
		{ key: "equals_json", label: "Equals JSON" },
	],
	array: [
		{ key: "contains", label: "Contains" },
		{ key: "not_contains", label: "Does not contain" },
		{ key: "is_empty", label: "Is empty" },
		{ key: "is_not_empty", label: "Is not empty" },
	],
};

export function CustomRuleContent({ flag, ruleIndex }: CustomRuleContentProps) {
	const { control, watch, setValue } = useFormContext<FlagEditorFormValues>();

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
						<div className="min-w-36 flex-1 max-w-xs">Context Key</div>
						<div className="w-36 shrink-0">Type</div>
						<div className="w-40 shrink-0">Operator</div>
						<div className="flex-1 min-w-48">Value</div>
						{fields.length > 1 && <div className="w-8 shrink-0" />}
					</div>
				)}

				{fields.map((field, idx) => {
					const condType =
						watch(
							`rules.${ruleIndex}.conditions.conditions.${idx}.type` as any,
						) || "string";
					const condOperator =
						watch(
							`rules.${ruleIndex}.conditions.conditions.${idx}.operator` as any,
						) || "";
					const validOperators = OPERATORS_BY_TYPE[condType] || [];

					return (
						<div
							key={field.id}
							className="flex items-start gap-4 flex-wrap p-4 rounded-3xl border">
							{/* Context Key */}
							<div className="min-w-36 flex-1 max-w-xs">
								<Controller
									name={
										`rules.${ruleIndex}.conditions.conditions.${idx}.contextKey` as any
									}
									control={control}
									render={({ field: keyField }) => (
										<TextField variant="secondary">
											<InputGroup>
												<InputGroup.Input
													placeholder="Context key (e.g. user.email)"
													value={keyField.value || ""}
													onChange={keyField.onChange}
													className="w-full"
												/>
											</InputGroup>
										</TextField>
									)}
								/>
							</div>

							{/* Type Select */}
							<div className="w-36 shrink-0">
								<Controller
									name={
										`rules.${ruleIndex}.conditions.conditions.${idx}.type` as any
									}
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
									name={
										`rules.${ruleIndex}.conditions.conditions.${idx}.operator` as any
									}
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

												const isPrevMulti =
													MULTI_VALUE_OPERATORS.includes(prevOp);
												const isNextMulti =
													MULTI_VALUE_OPERATORS.includes(nextOp);

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
											<div className="text-sm text-default-400 mt-2">
												No value required
											</div>
										);
									}

									if (
										condOperator === "is_one_of" ||
										condOperator === "is_not_one_of"
									) {
										return (
											<Controller
												name={
													`rules.${ruleIndex}.conditions.conditions.${idx}.values` as any
												}
												control={control}
												render={({ field: valuesField }) => (
													<MultiValueInput
														values={valuesField.value || []}
														onChange={valuesField.onChange}
														type={condType === "number" ? "number" : "string"}
													/>
												)}
											/>
										);
									}

									if (condType === "boolean") {
										return (
											<Controller
												name={
													`rules.${ruleIndex}.conditions.conditions.${idx}.value` as any
												}
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
												name={
													`rules.${ruleIndex}.conditions.conditions.${idx}.value` as any
												}
												control={control}
												render={({ field: valField }) => (
													<TextArea
														variant="secondary"
														placeholder='{"key": "value"}'
														value={valField.value || ""}
														onChange={valField.onChange}
														className="w-full font-mono"
													/>
												)}
											/>
										);
									}

									return (
										<Controller
											name={
												`rules.${ruleIndex}.conditions.conditions.${idx}.value` as any
											}
											control={control}
											render={({ field: valField }) => (
												<TextField variant="secondary">
													<InputGroup>
														<InputGroup.Input
															type={condType === "number" ? "number" : "text"}
															placeholder="Enter value"
															value={
																valField.value !== undefined
																	? String(valField.value)
																	: ""
															}
															onChange={(e) => {
																const val = e.target.value;
																valField.onChange(
																	condType === "number"
																		? val !== ""
																			? Number(val)
																			: ""
																		: val,
																);
															}}
															className="w-full"
														/>
													</InputGroup>
												</TextField>
											)}
										/>
									);
								})()}
							</div>

							{fields.length > 1 && (
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
				})}
			</div>

			<Button size="sm" variant="outline" onPress={handleAddCondition}>
				<PlusIcon className="size-4 mr-1.5" weight="bold" />
				Add Condition
			</Button>

			<div className="flex items-center gap-2 pl-4 pt-2 border-t border-divider/50">
				<span className="text-sm font-semibold text-default-600">
					then serve
				</span>
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
