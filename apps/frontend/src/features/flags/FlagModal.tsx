import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
	Drawer,
	toast,
} from "@heroui/react";
import { useCreateFlag, useUpdateFlag } from "./api";
import type { FeatureFlagListItem } from "@/types/feature-flag";
import { PermissionGuard } from "@/components/permission/PermissionGuard";

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
});

type FlagFormData = z.infer<typeof flagFormSchema>;

const FLAG_TYPES = [
	{ key: "boolean", label: "Boolean" },
	{ key: "multivariate", label: "Multivariate" },
] as const;

interface FlagModalProps {
	isOpen: boolean;
	onClose: () => void;
	flag?: FeatureFlagListItem;
}

export function FlagModal({ isOpen, onClose, flag }: FlagModalProps) {
	const isEditing = !!flag;
	const createFlag = useCreateFlag();
	const updateFlag = useUpdateFlag();

	const isPending = isEditing ? updateFlag.isPending : createFlag.isPending;

	const {
		register,
		handleSubmit,
		reset,
		control,
		formState: { errors },
	} = useForm<FlagFormData>({
		resolver: zodResolver(flagFormSchema),
		defaultValues: {
			key: flag?.key ?? "",
			name: flag?.name ?? "",
			description: flag?.description ?? "",
			flagType: flag?.flagType ?? "boolean",
		},
	});

	useEffect(() => {
		if (isOpen) {
			reset({
				key: flag?.key ?? "",
				name: flag?.name ?? "",
				description: flag?.description ?? "",
				flagType: flag?.flagType ?? "boolean",
			});
		}
	}, [isOpen, flag, reset]);

	const onSubmit = async (data: FlagFormData) => {
		try {
			if (isEditing && flag) {
				await updateFlag.mutateAsync({
					flagId: flag.id,
					name: data.name,
					description: data.description,
				});
				toast.success("Feature flag updated successfully");
			} else {
				await createFlag.mutateAsync({
					...data,
					flagType: data.flagType as "boolean" | "multivariate",
				});
				toast.success("Feature flag created successfully");
			}
			onClose();
		} catch {
			toast.danger(
				isEditing
					? "Failed to update feature flag"
					: "Failed to create feature flag",
			);
		}
	};

	return (
		<Drawer isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
			<Drawer.Backdrop>
				<Drawer.Content placement="right">
					<Drawer.Dialog>
						<Drawer.Header>
							<Drawer.Heading>
								{isEditing ? "Edit Feature Flag" : "Create Feature Flag"}
							</Drawer.Heading>
						</Drawer.Header>
						<Drawer.Body>
							<Form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
								<TextField isDisabled={isEditing}>
									<Label>Key</Label>
									<Input
										{...register("key")}
										placeholder="e.g. new-checkout-flow"
									/>
									{errors.key && <FieldError>{errors.key.message}</FieldError>}
								</TextField>

								<TextField>
									<Label>Name</Label>
									<Input
										{...register("name")}
										placeholder="New checkout flow"
									/>
									{errors.name && (
										<FieldError>{errors.name.message}</FieldError>
									)}
								</TextField>

								<TextField>
									<Label>Description</Label>
									<TextArea
										{...register("description")}
										placeholder="Optional description"
										rows={3}
									/>
								</TextField>

								<Controller
									name="flagType"
									control={control}
									render={({ field }) => (
										<Select
											selectedKey={field.value as string}
											onSelectionChange={(key) => {
												if (key) field.onChange(key);
											}}>
											<Label>Flag Type</Label>
											<SelectTrigger>
												<SelectValue />
												<SelectIndicator />
											</SelectTrigger>
											<SelectPopover>
												<ListBox>
													{FLAG_TYPES.map((t) => (
														<ListBoxItem id={t.key} key={t.key}>
															{t.label}
														</ListBoxItem>
													))}
												</ListBox>
											</SelectPopover>
											{errors.flagType && (
												<FieldError>{errors.flagType.message}</FieldError>
											)}
										</Select>
									)}
								/>

								<Drawer.Footer>
									<Button variant="ghost" onPress={onClose}>
										Cancel
									</Button>
									<PermissionGuard
										permission={(isEditing ? "flag:edit" : "flag:create")}
										mode="disable">
										<Button
											type="submit"
											variant="primary"
											isDisabled={isPending}>
											{isEditing ? "Save Changes" : "Create Flag"}
										</Button>
									</PermissionGuard>
								</Drawer.Footer>
							</Form>
						</Drawer.Body>
					</Drawer.Dialog>
				</Drawer.Content>
			</Drawer.Backdrop>
		</Drawer>
	);
}
