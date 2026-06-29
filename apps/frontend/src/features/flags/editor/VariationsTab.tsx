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
} from "@heroui/react";
import { PlusIcon, TrashIcon } from "@phosphor-icons/react";
import type { FeatureFlag } from "@/types/feature-flag";
import { useFormContext, useFieldArray, Controller } from "react-hook-form";
import type { FlagEditorFormValues } from "./schema";

import { VariationDot } from "@/components/ui/VariationDot";

interface VariationsTabProps {
	flag: FeatureFlag;
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
					Variations are the different values your feature flag can serve to
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
														<TextField variant="secondary">
															<InputGroup>
																<InputGroup.Prefix>
																	<VariationDot
																		index={index}
																		className="size-4"
																	/>
																</InputGroup.Prefix>
																<InputGroup.Input
																	value={keyField.value || ""}
																	readOnly={isBoolean}
																	onChange={keyField.onChange}
																	placeholder="Key (Optional)"
																	className={
																		isBoolean
																			? "bg-default-100 border-none w-full"
																			: "w-full"
																	}
																/>
															</InputGroup>
														</TextField>
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
															<TextField
																isInvalid={!!fieldState.error}
																variant="secondary">
																<InputGroup>
																	<InputGroup.Input
																		value={
																			valField.value !== undefined
																				? String(valField.value)
																				: ""
																		}
																		onChange={(e) =>
																			valField.onChange(e.target.value)
																		}
																		placeholder="Value"
																		className="w-full"
																	/>
																</InputGroup>
																{fieldState.error && (
																	<FieldError>
																		{fieldState.error.message}
																	</FieldError>
																)}
															</TextField>
														)}
													/>
												)}
											</Table.Cell>
											<Table.Cell>
												<Controller
													name={`variations.${index}.description` as const}
													control={control}
													render={({ field: descField }) => (
														<TextField variant="secondary">
															<TextArea
																placeholder="Description"
																value={descField.value || ""}
																onChange={descField.onChange}
																className="w-full min-h-9!"
																rows={1}
															/>
														</TextField>
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
											<div className="p-3 bg-default-50/50 flex justify-center border-t border-divider">
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
