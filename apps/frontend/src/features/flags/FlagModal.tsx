import { useEffect, useState, useRef } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
	Button,
	Form,
	FieldError,
	Label,
	TextField,
	Input,
	TextArea,
	Select,
	SelectTrigger,
	SelectValue,
	SelectPopover,
	SelectIndicator,
	ListBox,
	ListBoxItem,
	Modal,
	toast,
	Popover,
	PopoverTrigger,
	PopoverContent,
	RadioGroup,
	Radio,
	Description,
	cn,
	Checkbox,
} from "@heroui/react";
import {
	PlusIcon,
	GlobeIcon,
	BrowserIcon,
	TerminalIcon,
} from "@phosphor-icons/react";
import { useCreateFlag } from "./api";
import { PermissionGuard } from "@/components/permission/PermissionGuard";
import { VariationDot } from "@/components/ui/VariationDot";
import { ActionButton } from "#/components/ui/action-button";
import { TagInput } from "@/components/ui/tag-input";
import { SlugInput, slugValidation } from "#/components/ui/slug-input";

const flagFormSchema = z
	.object({
		key: slugValidation,
		name: z.string().min(1, "Name is required").max(255),
		description: z.string().optional(),
		flagType: z.enum(["boolean", "multivariate"]),
		visibility: z.enum(["all", "client_only", "server_only"]),
		isTemporary: z.boolean(),
		tags: z.array(z.string()).optional(),
		variations: z.array(
			z.object({
				key: z.string().optional(),
				value: z.string().min(1, "Value is required"),
				description: z.string().optional(),
			}),
		),
	})
	.superRefine((data, ctx) => {
		const seenKeys = new Set<string>();
		data.variations.forEach((v, idx) => {
			const k = v.key?.trim() || v.value.trim();
			if (seenKeys.has(k)) {
				ctx.addIssue({
					code: "custom",
					message: `Duplicate variation key: "${k}"`,
					path: ["variations", idx, "key"],
				});
			} else {
				seenKeys.add(k);
			}
		});
	});

type FlagFormData = z.infer<typeof flagFormSchema>;

const FLAG_TYPES = [
	{ key: "boolean", label: "Boolean" },
	{ key: "multivariate", label: "Multivariate" },
] as const;

const visibilityOptions = [
	{
		value: "all",
		title: "All SDKs",
		description: "Available for both client and server evaluations.",
		icon: GlobeIcon,
	},
	{
		value: "client_only",
		title: "Client Only",
		description: "Visible to client-side SDKs only. Restricted on backend.",
		icon: BrowserIcon,
	},
	{
		value: "server_only",
		title: "Server Only",
		description: "Secret flags, accessible by server/backend keys only.",
		icon: TerminalIcon,
	},
] as const;

interface EditVariationDialogProps {
	variation: { key?: string; value: string; description?: string };
	onSave: (data: { key?: string; value: string; description?: string }) => void;
	onCancel: () => void;
	showDelete: boolean;
	onDelete?: () => void;
}

function EditVariationDialog({
	variation,
	onSave,
	onCancel,
	showDelete,
	onDelete,
}: EditVariationDialogProps) {
	const [key, setKey] = useState(variation.key || "");
	const [value, setValue] = useState(variation.value);
	const [description, setDescription] = useState(variation.description || "");

	return (
		<Popover.Dialog className="p-3 w-64 space-y-3">
			<div className="text-xs font-semibold text-foreground/80 border-b border-divider pb-1.5">
				Edit Variation
			</div>
			<TextField variant="secondary">
				<Label>Key / Name (Optional)</Label>
				<Input
					value={key}
					onChange={(e) => setKey(e.target.value)}
					placeholder="Optional name"
				/>
			</TextField>
			<TextField variant="secondary" isRequired>
				<Label>Value</Label>
				<Input
					value={value}
					onChange={(e) => setValue(e.target.value)}
					placeholder="Value"
				/>
			</TextField>
			<TextField variant="secondary">
				<Label>Description</Label>
				<Input
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					placeholder="Optional description"
				/>
			</TextField>
			<div className="flex gap-2 justify-end pt-1">
				{showDelete && onDelete && (
					<Button
						variant="danger-soft"
						size="sm"
						className="mr-auto"
						onPress={onDelete}>
						Delete
					</Button>
				)}
				<Button variant="ghost" size="sm" onPress={onCancel}>
					Cancel
				</Button>
				<Button
					variant="primary"
					size="sm"
					onPress={() => {
						if (!value.trim()) {
							toast.danger("Value is required");
							return;
						}
						onSave({
							key: key.trim(),
							value: value.trim(),
							description: description.trim(),
						});
					}}>
					Save
				</Button>
			</div>
		</Popover.Dialog>
	);
}

interface FlagModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function FlagModal({ isOpen, onClose }: FlagModalProps) {
	const navigate = useNavigate();
	const { projectSlug } = useParams({ strict: false }) as {
		projectSlug: string;
	};
	const createFlag = useCreateFlag();

	// State for the new variation popover form
	const [newKey, setNewKey] = useState("");
	const [newValue, setNewValue] = useState("");
	const [newDesc, setNewDesc] = useState("");
	const [isAddOpen, setIsAddOpen] = useState(false);

	// Track which popover index is open for editing
	const [openPopoverIndex, setOpenPopoverIndex] = useState<number | null>(null);

	const {
		register,
		handleSubmit,
		reset,
		control,
		watch,
		setValue,
		formState: { errors },
	} = useForm<FlagFormData>({
		resolver: standardSchemaResolver(flagFormSchema),
		defaultValues: {
			key: "",
			name: "",
			description: "",
			flagType: "boolean",
			visibility: "all",
			isTemporary: false,
			tags: [],
			variations: [
				{ key: "true", value: "true", description: "" },
				{ key: "false", value: "false", description: "" },
			],
		},
	});

	const { fields, append, remove, update } = useFieldArray({
		control,
		name: "variations",
	});

	const flagType = watch("flagType");
	const lastFlagTypeRef = useRef(flagType);

	useEffect(() => {
		if (isOpen) {
			reset({
				key: "",
				name: "",
				description: "",
				flagType: "boolean",
				visibility: "all",
				isTemporary: false,
				tags: [],
				variations: [
					{ key: "true", value: "true", description: "" },
					{ key: "false", value: "false", description: "" },
				],
			});
			setNewKey("");
			setNewValue("");
			setNewDesc("");
			setIsAddOpen(false);
			setOpenPopoverIndex(null);
			lastFlagTypeRef.current = "boolean";
		}
	}, [isOpen, reset]);

	useEffect(() => {
		if (flagType !== lastFlagTypeRef.current) {
			if (flagType === "boolean") {
				setValue("variations", [
					{ key: "true", value: "true", description: "" },
					{ key: "false", value: "false", description: "" },
				]);
			} else if (flagType === "multivariate") {
				setValue("variations", [
					{ key: "variation-1", value: "value-1", description: "" },
					{ key: "variation-2", value: "value-2", description: "" },
				]);
			}
			lastFlagTypeRef.current = flagType;
		}
	}, [flagType, setValue]);

	const onSubmit = async (data: FlagFormData) => {
		try {
			const payload = {
				...data,
				variations: data.variations.map((v) => ({
					key: v.key || v.value,
					value: v.value,
					description: v.description,
				})),
			};
			const result = await createFlag.mutateAsync(payload as any);
			toast.success("Feature flag created successfully");
			navigate({
				to: "/projects/$projectSlug/flags/$flagSlug",
				params: { projectSlug, flagSlug: result.key },
			});
			// onClose();
		} catch {
			toast.danger("Failed to create feature flag");
		}
	};

	return (
		<Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
			<Modal.Backdrop>
				<Modal.Container size="lg">
					<Modal.Dialog className="max-w-xl">
						<Modal.CloseTrigger />
						<Modal.Header>
							<Modal.Heading>Create Feature Flag</Modal.Heading>
						</Modal.Header>
						<Modal.Body>
							<Form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
								<Controller
									name="key"
									control={control}
									render={({ field }) => (
										<SlugInput
											value={field.value}
											onChange={field.onChange}
											onBlur={field.onBlur}
											nameValue={watch("name")}
											error={errors.key?.message}
											label="Key"
											placeholder="e.g. new-checkout-flow"
											isRequired
											autoFocus
										/>
									)}
								/>

								<TextField
									variant="secondary"
									isRequired
									isInvalid={!!errors.name}>
									<Label>Name</Label>
									<Input
										{...register("name")}
										placeholder="New checkout flow"
									/>
									{errors.name && (
										<FieldError>{errors.name.message}</FieldError>
									)}
								</TextField>

								<TextField variant="secondary">
									<Label>Description</Label>
									<TextArea
										{...register("description")}
										placeholder="Optional description"
										rows={3}
									/>
								</TextField>

								<div className="flex flex-col gap-1.5">
									<Label>Tags</Label>
									<Controller
										name="tags"
										control={control}
										render={({ field }) => (
											<TagInput
												value={field.value}
												onChange={field.onChange}
												placeholder="Search tags or type and press Enter to create..."
											/>
										)}
									/>
								</div>

								<Controller
									name="isTemporary"
									control={control}
									render={({ field }) => (
										<Checkbox
											isSelected={field.value}
											onChange={field.onChange}
											variant="secondary">
											<Checkbox.Content className="items-start">
												<Checkbox.Control className="relative top-0.5">
													<Checkbox.Indicator />
												</Checkbox.Control>
												<Label className="flex flex-col gap-0.5">
													<span className="text-sm font-medium text-foreground">
														Temporary flag
													</span>
													<span className="text-xs text-muted">
														Temporary flags are used for short-lived changes
														(e.g. rollouts, migrations). They should be removed
														once complete.
													</span>
												</Label>
											</Checkbox.Content>
										</Checkbox>
									)}
								/>

								<Controller
									name="visibility"
									control={control}
									render={({ field }) => (
										<RadioGroup
											value={field.value}
											onChange={field.onChange}
											variant="secondary"
											className="w-full">
											<div className="flex flex-wrap items-center justify-between gap-4">
												<Label>Visibility Scope</Label>
											</div>
											<div className="grid gap-3 md:grid-cols-3">
												{visibilityOptions.map((option) => {
													const IconComponent = option.icon;
													return (
														<Radio
															key={option.value}
															value={option.value}
															className="w-full">
															<Radio.Content
																className={cn(
																	"group relative flex w-full flex-col items-start justify-start gap-2.5 rounded-xl border border-transparent bg-default-soft p-4 transition-all hover:bg-default cursor-pointer text-left h-full",
																	"data-[selected=true]:border-accent data-[selected=true]:bg-accent-soft/10",
																)}>
																<Radio.Control className="absolute top-3 right-4 size-4">
																	<Radio.Indicator />
																</Radio.Control>
																<IconComponent className="size-5 group-data-[selected=true]:text-accent" />
																<div className="flex flex-col gap-1 pr-4">
																	<span className="text-sm font-semibold text-foreground">
																		{option.title}
																	</span>
																	<Description className="text-xs text-default-400 font-normal leading-relaxed">
																		{option.description}
																	</Description>
																</div>
															</Radio.Content>
														</Radio>
													);
												})}
											</div>
											{errors.visibility && (
												<FieldError>{errors.visibility.message}</FieldError>
											)}
										</RadioGroup>
									)}
								/>

								<Controller
									name="flagType"
									control={control}
									render={({ field }) => (
										<Select
											variant="secondary"
											value={field.value as string}
											onChange={(key) => {
												if (key) field.onChange(key);
											}}>
											<Label>Flag Type</Label>
											<SelectTrigger>
												<SelectValue />
												<SelectIndicator />
											</SelectTrigger>
											<SelectPopover>
												<ListBox items={FLAG_TYPES}>
													{(t: any) => (
														<ListBoxItem id={t.key} key={t.key}>
															{t.label}
														</ListBoxItem>
													)}
												</ListBox>
											</SelectPopover>
											{errors.flagType && (
												<FieldError>{errors.flagType.message}</FieldError>
											)}
										</Select>
									)}
								/>

								<div className="space-y-3 pt-2">
									<div className="flex items-center justify-between">
										<span className="text-sm font-semibold text-foreground">
											Variations
										</span>
										{errors.variations && (
											<span className="text-xs text-danger">
												{errors.variations.message}
											</span>
										)}
									</div>

									<div className="flex flex-wrap gap-2 items-center">
										{fields.map((field, idx) => {
											const varKey = watch(`variations.${idx}.key`);
											const varVal = watch(`variations.${idx}.value`);
											const label = varKey || varVal || `variation-${idx + 1}`;
											const isOpen = openPopoverIndex === idx;

											return (
												<Popover
													key={field.id}
													isOpen={isOpen}
													onOpenChange={(open) =>
														setOpenPopoverIndex(open ? idx : null)
													}>
													<PopoverTrigger>
														<Button
															variant="outline"
															size="sm"
															className="flex items-center gap-1.5 border border-divider hover:bg-default-100">
															<VariationDot index={idx} className="size-3" />
															<span className="font-medium text-xs max-w-30 truncate">
																{label}
															</span>
														</Button>
													</PopoverTrigger>
													<PopoverContent>
														<EditVariationDialog
															variation={field}
															showDelete={
																flagType === "multivariate" && fields.length > 2
															}
															onSave={(data) => {
																const trimmedKey = (data.key ?? "").trim();
																const hasDuplicate = fields.some(
																	(f, fIdx) =>
																		fIdx !== idx &&
																		(f.key || f.value) === trimmedKey,
																);
																if (hasDuplicate) {
																	toast.danger(
																		`Variation key "${trimmedKey}" is already used by another variation.`,
																	);
																	return;
																}
																update(idx, {
																	key: trimmedKey,
																	value: data.value,
																	description: data.description,
																});
																setOpenPopoverIndex(null);
															}}
															onCancel={() => setOpenPopoverIndex(null)}
															onDelete={() => {
																if (fields.length <= 2) {
																	toast.danger(
																		"At least 2 variations are required for multivariate flags",
																	);
																	return;
																}
																remove(idx);
																setOpenPopoverIndex(null);
															}}
														/>
													</PopoverContent>
												</Popover>
											);
										})}

										{/* Add Variation Button with Popover (Only for Multivariate) */}
										{flagType === "multivariate" && (
											<Popover isOpen={isAddOpen} onOpenChange={setIsAddOpen}>
												<PopoverTrigger>
													<Button
														isIconOnly
														variant="outline"
														size="sm"
														className="border border-dashed border-divider hover:bg-default-100"
														aria-label="Add Variation">
														<PlusIcon className="size-4" />
													</Button>
												</PopoverTrigger>
												<PopoverContent>
													<Popover.Dialog className="p-3 w-64 space-y-3">
														<div className="text-xs font-semibold text-foreground/80 border-b border-divider pb-1.5">
															Add Variation
														</div>
														<TextField variant="secondary">
															<Label>Key / Name (Optional)</Label>
															<Input
																value={newKey}
																onChange={(e) => setNewKey(e.target.value)}
																placeholder={`variation-${fields.length + 1}`}
															/>
														</TextField>
														<TextField variant="secondary" isRequired>
															<Label>Value</Label>
															<Input
																value={newValue}
																onChange={(e) => setNewValue(e.target.value)}
																placeholder={`value-${fields.length + 1}`}
															/>
														</TextField>
														<TextField variant="secondary">
															<Label>Description (Optional)</Label>
															<Input
																value={newDesc}
																onChange={(e) => setNewDesc(e.target.value)}
																placeholder="Optional description"
															/>
														</TextField>
														<div className="flex gap-2 justify-end pt-1">
															<Button
																variant="ghost"
																size="sm"
																onPress={() => {
																	setNewKey("");
																	setNewValue("");
																	setNewDesc("");
																	setIsAddOpen(false);
																}}>
																Cancel
															</Button>
															<Button
																variant="primary"
																size="sm"
																onPress={() => {
																	const getUniqueVariationKey = () => {
																		const keys = new Set(
																			fields.map((f) => f.key),
																		);
																		let i = fields.length + 1;
																		while (keys.has(`variation-${i}`)) {
																			i++;
																		}
																		return `variation-${i}`;
																	};
																	const getUniqueVariationValue = () => {
																		const vals = new Set(
																			fields.map((f) => f.value),
																		);
																		let i = fields.length + 1;
																		while (vals.has(`value-${i}`)) {
																			i++;
																		}
																		return `value-${i}`;
																	};

																	const finalKey =
																		newKey.trim() || getUniqueVariationKey();
																	const finalVal =
																		newValue.trim() ||
																		getUniqueVariationValue();

																	if (
																		fields.some(
																			(f) => (f.key || f.value) === finalKey,
																		)
																	) {
																		toast.danger(
																			`Variation key "${finalKey}" already exists.`,
																		);
																		return;
																	}

																	append({
																		key: finalKey,
																		value: finalVal,
																		description: newDesc.trim() || "",
																	});
																	setNewKey("");
																	setNewValue("");
																	setNewDesc("");
																	setIsAddOpen(false);
																}}>
																Add
															</Button>
														</div>
													</Popover.Dialog>
												</PopoverContent>
											</Popover>
										)}
									</div>
								</div>

								<Modal.Footer>
									<Button variant="ghost" onPress={onClose}>
										Cancel
									</Button>
									<PermissionGuard permission="flag:create" mode="disable">
										<ActionButton
											isPending={createFlag.isPending}
											type="submit"
											variant="primary"
											isDisabled={createFlag.isPending}>
											Create Flag
										</ActionButton>
									</PermissionGuard>
								</Modal.Footer>
							</Form>
						</Modal.Body>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>
		</Modal>
	);
}
