import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
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
} from "@heroui/react";
import { useCreateFlag } from "./api";
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
}

export function FlagModal({ isOpen, onClose }: FlagModalProps) {
	const navigate = useNavigate();
	const { projectSlug } = useParams({ strict: false }) as {
		projectSlug: string;
	};
	const createFlag = useCreateFlag();

	const {
		register,
		handleSubmit,
		reset,
		control,
		formState: { errors },
	} = useForm<FlagFormData>({
		resolver: zodResolver(flagFormSchema),
		defaultValues: {
			key: "",
			name: "",
			description: "",
			flagType: "boolean",
		},
	});

	useEffect(() => {
		if (isOpen) {
			reset({
				key: "",
				name: "",
				description: "",
				flagType: "boolean",
			});
		}
	}, [isOpen, reset]);

	const onSubmit = async (data: FlagFormData) => {
		try {
			const result = await createFlag.mutateAsync({
				...data,
				flagType: data.flagType as "boolean" | "multivariate",
			});
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
				<Modal.Container>
					<Modal.Dialog>
						<Modal.Header>
							<Modal.Heading>Create Feature Flag</Modal.Heading>
						</Modal.Header>
						<Modal.Body>
							<Form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
								<TextField>
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
