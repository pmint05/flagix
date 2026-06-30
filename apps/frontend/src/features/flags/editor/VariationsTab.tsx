import { useState, useEffect } from "react";
import {
	Button,
	Table,
	Chip,
	Tooltip,
	TextField,
	InputGroup,
	FieldError,
	cn,
	TextArea,
	Popover,
} from "@heroui/react";
import { PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { COLOR_KEYS, TAILWIND_COLORS_500 } from "@/lib/variation-colors";
import type { FeatureFlag } from "@/types/feature-flag";
import { useFormContext, useFieldArray, Controller } from "react-hook-form";
import type { FlagEditorFormValues } from "./schema";

import { VariationDot } from "@/components/ui/VariationDot";

interface VariationsTabProps {
	flag: FeatureFlag;
}

interface VariationInputProps {
	value: string;
	onChange: (val: string) => void;
	readOnly?: boolean;
	placeholder?: string;
	className?: string;
	prefix?: React.ReactNode;
}

function VariationInput({
	value,
	onChange,
	readOnly,
	placeholder,
	className,
	prefix,
}: VariationInputProps) {
	const [localVal, setLocalVal] = useState(value || "");

	useEffect(() => {
		setLocalVal(value || "");
	}, [value]);

	return (
		<TextField variant="secondary">
			<InputGroup>
				{prefix && <InputGroup.Prefix>{prefix}</InputGroup.Prefix>}
				<InputGroup.Input
					value={localVal}
					readOnly={readOnly}
					onChange={(e) => setLocalVal(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							e.preventDefault();
							e.currentTarget.blur();
						}
					}}
					onBlur={() => {
						if (localVal !== value) {
							onChange(localVal);
						}
					}}
					placeholder={placeholder}
					className={className}
				/>
			</InputGroup>
		</TextField>
	);
}

interface VariationValueInputProps {
	value: string;
	onChange: (val: string) => void;
	error?: any;
	placeholder?: string;
}

function VariationValueInput({
	value,
	onChange,
	error,
	placeholder,
}: VariationValueInputProps) {
	const [localVal, setLocalVal] = useState(value || "");

	useEffect(() => {
		setLocalVal(value || "");
	}, [value]);

	return (
		<TextField isInvalid={!!error} variant="secondary">
			<InputGroup>
				<InputGroup.Input
					value={localVal}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							e.preventDefault();
							e.currentTarget.blur();
						}
					}}
					onChange={(e) => setLocalVal(e.target.value)}
					onBlur={() => {
						if (localVal !== value) {
							onChange(localVal);
						}
					}}
					placeholder={placeholder}
					className="w-full"
				/>
			</InputGroup>
			{error && <FieldError>{error.message}</FieldError>}
		</TextField>
	);
}

interface VariationTextAreaProps {
	value: string;
	onChange: (val: string) => void;
	placeholder?: string;
}

function VariationTextArea({
	value,
	onChange,
	placeholder,
}: VariationTextAreaProps) {
	const [localVal, setLocalVal] = useState(value || "");

	useEffect(() => {
		setLocalVal(value || "");
	}, [value]);

	return (
		<TextField variant="secondary">
			<TextArea
				placeholder={placeholder}
				value={localVal}
				onChange={(e) => setLocalVal(e.target.value)}
				onBlur={() => {
					if (localVal !== value) {
						onChange(localVal);
					}
				}}
				className="w-full min-h-9!"
				rows={1}
			/>
		</TextField>
	);
}

export function VariationsTab({ flag }: VariationsTabProps) {
	const { control } = useFormContext<FlagEditorFormValues>();
	const { fields, append, remove } = useFieldArray({
		control,
		name: "variations",
	});

	const isBoolean = flag.flagType === "boolean";

	const handleAdd = () => {
		if (isBoolean) return;
		append({
			id: crypto.randomUUID(),
			key: `variation-${fields.length + 1}`,
			value: "new-value",
			description: "",
			color: COLOR_KEYS[fields.length % COLOR_KEYS.length],
		});
	};

	const handleRemove = (index: number) => {
		if (isBoolean) return;
		remove(index);
	};

	return (
		<div className="py-6 space-y-6">
			<div>
				<div className="flex items-center gap-2">
					<h2 className="text-lg font-semibold text-foreground">Variations</h2>
					<Chip variant="soft" className="bg-default-100 text-default-600">
						{flag.flagType}
					</Chip>
				</div>
				<p className="text-sm text-default-500">
					Variations are the different values your feature flag can resolve for
					users.
				</p>
			</div>

			<div>
				<Table
					aria-label="Variations table"
					className="[&_th]:bg-default-100 [&_th]:text-default-600 [&_th]:font-semibold [&_td]:py-3 rounded-3xl">
					<Table.ScrollContainer>
						<Table.Content>
							<Table.Header>
								<Table.Column isRowHeader>Key / Name</Table.Column>
								<Table.Column>Value</Table.Column>
								<Table.Column>Description (Optional)</Table.Column>
								<Table.Column className="w-20 text-right">Actions</Table.Column>
							</Table.Header>
							<Table.Body>
								{fields.map((field, index) => {
									return (
										<Table.Row
											key={field.id}
											className="border-b border-divider last:border-b-0">
											<Table.Cell>
												<Controller
													name={`variations.${index}.key` as const}
													control={control}
													render={({ field: keyField }) => (
														<VariationInput
															value={keyField.value || ""}
															onChange={keyField.onChange}
															readOnly={isBoolean}
															placeholder="Key (Optional)"
															className={
																isBoolean
																	? "bg-default-100 border-none w-full"
																	: "w-full"
															}
															prefix={
																isBoolean ? (
																	<VariationDot
																		color={field.color}
																		index={index}
																		className="size-4"
																	/>
																) : (
																	<Controller
																		name={`variations.${index}.color` as const}
																		control={control}
																		render={({ field: colorField }) => (
																			<Popover>
																				<Popover.Trigger>
																					<button
																						type="button"
																						className="p-1 -ml-1.5 rounded-full hover:bg-default-100 flex items-center justify-center focus:outline-hidden"
																						aria-label="Change color"
																					>
																						<VariationDot
																							color={colorField.value}
																							index={index}
																							className="size-4 cursor-pointer hover:scale-110 transition-transform shrink-0"
																						/>
																					</button>
																				</Popover.Trigger>
																				<Popover.Content className="p-3 w-48">
																					<div className="text-xs font-semibold mb-2 text-default-500">Choose Color</div>
																					<div className="grid grid-cols-6 gap-2">
																						{COLOR_KEYS.map((colorName) => {
																							const colorDetails = TAILWIND_COLORS_500[colorName];
																							return (
																								<Tooltip key={colorName}>
																									<Tooltip.Trigger>
																										<button
																											type="button"
																											onClick={() => {
																												colorField.onChange(colorName);
																											}}
																											className={cn(
																												"size-6 rounded-full border-2 transition-all hover:scale-110 focus:outline-hidden",
																												colorField.value === colorName
																													? "border-foreground scale-105"
																													: "border-transparent"
																											)}
																											style={{ backgroundColor: colorDetails.hex }}
																											aria-label={colorName}
																										/>
																									</Tooltip.Trigger>
																									<Tooltip.Content className="capitalize">
																										{colorName}
																									</Tooltip.Content>
																								</Tooltip>
																							);
																						})}
																					</div>
																				</Popover.Content>
																			</Popover>
																		)}
																	/>
																)
															}
														/>
													)}
												/>
											</Table.Cell>
											<Table.Cell>
												{isBoolean ? (
													<div className="flex items-center gap-2">
														<Chip
															variant="soft"
															className={cn("", {
																"bg-success/20 text-success":
																	field.value === true ||
																	field.value === "true",
																"bg-danger/20 text-danger":
																	field.value === false ||
																	field.value === "false",
															})}>
															{String(field.value)}
														</Chip>
													</div>
												) : (
													<Controller
														name={`variations.${index}.value` as const}
														control={control}
														render={({ field: valField, fieldState }) => (
															<VariationValueInput
																value={
																	valField.value !== undefined
																		? String(valField.value)
																		: ""
																}
																onChange={valField.onChange}
																error={fieldState.error}
																placeholder="Value"
															/>
														)}
													/>
												)}
											</Table.Cell>
											<Table.Cell>
												<Controller
													name={`variations.${index}.description` as const}
													control={control}
													render={({ field: descField }) => (
														<VariationTextArea
															value={descField.value || ""}
															onChange={descField.onChange}
															placeholder="Description"
														/>
													)}
												/>
											</Table.Cell>
											<Table.Cell>
												<div className="flex justify-end">
													{!isBoolean && (
														<Tooltip>
															<Tooltip.Trigger>
																<Button
																	isIconOnly
																	variant="ghost"
																	size="sm"
																	className="hover:bg-danger/10 text-danger hover:text-danger"
																	onPress={() => handleRemove(index)}>
																	<TrashIcon className="h-4 w-4" />
																</Button>
															</Tooltip.Trigger>
															<Tooltip.Content>
																Remove variation
															</Tooltip.Content>
														</Tooltip>
													)}
												</div>
											</Table.Cell>
										</Table.Row>
									);
								})}
								{!isBoolean && (
									<Table.Row>
										<Table.Cell colSpan={4} className="p-0">
											<div className="px-3 flex justify-center">
												<Button
													variant="ghost"
													size="sm"
													onPress={handleAdd}
													className="w-full">
													<PlusIcon className="h-4 w-4 mr-2" />
													Add Variation
												</Button>
											</div>
										</Table.Cell>
									</Table.Row>
								)}
							</Table.Body>
						</Table.Content>
					</Table.ScrollContainer>
				</Table>
			</div>

			{isBoolean && (
				<div className="bg-primary-50 text-primary-600 p-4 rounded-lg text-sm flex items-start gap-3">
					<div className="font-medium">Boolean Flag Note:</div>
					<div>
						Boolean flags automatically have <code>true</code> and{" "}
						<code>false</code> variations. You cannot add or remove variations,
						but you can edit their descriptions to clarify what each state
						means.
					</div>
				</div>
			)}
		</div>
	);
}
