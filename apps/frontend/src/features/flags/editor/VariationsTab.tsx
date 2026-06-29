"use client";
import {
	Button,
	Table,
	Chip,
	Tooltip,
	TextField,
	InputGroup,
	cn,
} from "@heroui/react";
import {
	PlusIcon,
	TrashIcon,
	DotsSixVerticalIcon,
} from "@phosphor-icons/react";
import type { FeatureFlag } from "@/types/feature-flag";
import { useFormContext, useFieldArray, Controller } from "react-hook-form";
import type { FlagEditorFormValues } from "./schema";

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
		<div className="py-4 space-y-6">
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

			<div className="border border-divider rounded-xl overflow-hidden bg-content1">
				<Table
					aria-label="Variations table"
					className="[&_th]:bg-default-100 [&_th]:text-default-600 [&_th]:font-semibold [&_td]:py-3">
					<Table.ScrollContainer>
						<Table.Content>
							<Table.Header>
								<Table.Column className="w-10" isRowHeader></Table.Column>
								<Table.Column>Key / Name</Table.Column>
								<Table.Column>Value</Table.Column>
								<Table.Column>Description</Table.Column>
								<Table.Column className="w-20 text-right">Actions</Table.Column>
							</Table.Header>
							<Table.Body items={fields}>
								{flag.variations?.map((variation) => {
									const index = fields.findIndex((f) => f.id === variation.id);
									return (
										<Table.Row
											key={variation.id}
											className="border-b border-divider last:border-b-0">
											<Table.Cell>
												<div className="flex items-center justify-center cursor-grab text-default-400 hover:text-foreground">
													<DotsSixVerticalIcon className="h-5 w-5" />
												</div>
											</Table.Cell>
											<Table.Cell>
												<Controller
													name={`variations.${index}.key` as const}
													control={control}
													render={({ field }) => (
														<TextField>
															<InputGroup>
																<InputGroup.Input
																	value={field.value}
																	readOnly={isBoolean}
																	onChange={field.onChange}
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
												<div className="flex items-center gap-2">
													<Chip
														variant="soft"
														className={cn("", {
															"bg-success/20 text-success":
																variation.value === true,
															"bg-danger/20 text-danger":
																variation.value === false,
															"bg-default/20 text-default-foreground":
																variation.value !== true &&
																variation.value !== false,
														})}>
														{String(variation.value)}
													</Chip>
												</div>
											</Table.Cell>
											<Table.Cell>
												<Controller
													name={`variations.${index}.description` as const}
													control={control}
													render={({ field }) => (
														<TextField>
															<InputGroup>
																<InputGroup.Input
																	placeholder="Optional description"
																	value={field.value || ""}
																	onChange={field.onChange}
																	className="w-full"
																/>
															</InputGroup>
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
																	variant="danger-soft"
																	size="sm"
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
							</Table.Body>
						</Table.Content>
					</Table.ScrollContainer>
				</Table>
				{!isBoolean && (
					<div className="p-3 bg-default-50 border-t border-divider">
						<Button variant="primary" size="sm" onPress={handleAdd}>
							<PlusIcon className="h-4 w-4 mr-2" />
							Add Variation
						</Button>
					</div>
				)}
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
