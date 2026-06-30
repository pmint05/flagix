import { useEffect, useState, useRef } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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

const flagFormSchema = z.object({
	key: z
		.string()
		.min(1, "Key is required")
		.max(255)
		.regex(
			/^[a-zA-Z0-9_-]+$/,
			"Only letters, numbers, underscores, and hyphens",
		),
	name: z.string().min(1, "Name is required").max(255),
	description: z.string().optional(),
	flagType: z.enum(["boolean", "multivariate"]),
	visibility: z.enum(["all", "client_only", "server_only"]),
	variations: z.array(
		z.object({
			key: z.string().optional(),
			value: z.string().min(1, "Value is required"),
			description: z.string().optional(),
		}),
	),
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
		resolver: zodResolver(flagFormSchema),
		defaultValues: {
			key: "",
			name: "",
			description: "",
			flagType: "boolean",
			visibility: "all",
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
			onClose();
			navigate({
				to: "/projects/$projectSlug/flags/$flagSlug",
				params: { projectSlug, flagSlug: result.key },
			});
		} catch {
			toast.danger("Failed to create feature flag");
		}
	};

	return (
		<Modal.Root isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
			<Modal.Backdrop>
				<Modal.Container size="lg">
					<Modal.Dialog className="max-w-xl">
						<Modal.Header>
							<Modal.Heading>Create Feature Flag</Modal.Heading>
						</Modal.Header>
						<Modal.Body>
							<Form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
								<TextField
									variant="secondary"
									isRequired
									isInvalid={!!errors.key}>
									<Label>Key</Label>
									<Input
										{...register("key")}
										placeholder="e.g. new-checkout-flow"
									/>
									{errors.key && <FieldError>{errors.key.message}</FieldError>}
								</TextField>

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
																update(idx, {
																	key: data.key,
																	value: data.value,
																	description: data.description,
																});
																setOpenPopoverIndex(null);
															}}
															onCancel={() => setOpenPopoverIndex(null)}
															onDelete={() => {
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
																	const val =
																		newValue.trim() ||
																		`value-${fields.length + 1}`;
																	append({
																		key:
																			newKey.trim() ||
																			`variation-${fields.length + 1}`,
																		value: val,
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
										<Button
											type="submit"
											variant="primary"
											isDisabled={createFlag.isPending}>
											Create Flag
										</Button>
									</PermissionGuard>
								</Modal.Footer>
							</Form>
						</Modal.Body>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>
		</Modal.Root>
	);
}
