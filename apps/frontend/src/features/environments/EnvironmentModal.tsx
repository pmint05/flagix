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
	Modal,
	toast,
} from "@heroui/react";
import {
	useCreateEnvironment,
	useUpdateEnvironment,
} from "./api";
import { useContextStore } from "@/stores";
import type { Environment } from "@/types/environment";

const envFormSchema = z.object({
	name: z.string().min(1, "Name is required").max(255),
	type: z.enum(["development", "staging", "production", "custom"]),
	description: z.string().optional(),
});

type EnvFormData = z.infer<typeof envFormSchema>;

const ENV_TYPES = [
	{ key: "development", label: "Development" },
	{ key: "staging", label: "Staging" },
	{ key: "production", label: "Production" },
	{ key: "custom", label: "Custom" },
] as const;

interface EnvironmentModalProps {
	isOpen: boolean;
	onClose: () => void;
	environment?: Environment;
}

export function EnvironmentModal({
	isOpen,
	onClose,
	environment,
}: EnvironmentModalProps) {
	const isEditing = !!environment;
	const createEnvironment = useCreateEnvironment();
	const updateEnvironment = useUpdateEnvironment();
	const selectedProject = useContextStore((s) => s.selectedProject);

	const {
		register,
		handleSubmit,
		reset,
		control,
		formState: { errors },
	} = useForm<EnvFormData>({
		resolver: zodResolver(envFormSchema),
		defaultValues: {
			name: environment?.name ?? "",
			type: environment?.type ?? "development",
			description: environment?.description ?? "",
		},
	});

	useEffect(() => {
		if (isOpen) {
			reset({
				name: environment?.name ?? "",
				type: environment?.type ?? "development",
				description: environment?.description ?? "",
			});
		}
	}, [isOpen, environment, reset]);

	const onSubmit = async (data: EnvFormData) => {
		try {
			if (isEditing) {
				await updateEnvironment.mutateAsync({
					id: environment.id,
					...data,
				});
				toast.success("Environment updated successfully");
			} else {
				if (!selectedProject?.id) {
					toast.danger("No project selected");
					return;
				}
				await createEnvironment.mutateAsync(data);
				toast.success("Environment created successfully");
			}
			onClose();
		} catch {
			toast.danger(
				isEditing ? "Failed to update environment" : "Failed to create environment",
			);
		}
	};

	return (
		<Modal.Root isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
			<Modal.Backdrop />
			<Modal.Container>
				<Modal.Dialog>
					<Modal.Header>
						<Modal.Heading>
							{isEditing ? "Edit Environment" : "Create Environment"}
						</Modal.Heading>
					</Modal.Header>
					<Modal.Body>
						<Form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
							<TextField>
								<Label>Name</Label>
								<Input
									{...register("name")}
									placeholder="e.g. Production"
								/>
								{errors.name && (
									<FieldError>{errors.name.message}</FieldError>
								)}
							</TextField>

							<Controller
								name="type"
								control={control}
								render={({ field }) => (
								<Select
									selectedKey={field.value as string}
									onSelectionChange={(key) => {
										if (key) field.onChange(key);
									}}
								>
										<Label>Type</Label>
										<SelectTrigger>
											<SelectValue />
											<SelectIndicator />
										</SelectTrigger>
										<SelectPopover>
											<ListBox>
												{ENV_TYPES.map((t) => (
													<ListBoxItem id={t.key} key={t.key}>
														{t.label}
													</ListBoxItem>
												))}
											</ListBox>
										</SelectPopover>
										{errors.type && (
											<FieldError>{errors.type.message}</FieldError>
										)}
									</Select>
								)}
							/>

							<TextField>
								<Label>Description</Label>
								<TextArea
									{...register("description")}
									placeholder="Optional description"
									rows={3}
								/>
							</TextField>

							<Modal.Footer>
								<Button variant="ghost" onPress={onClose}>
									Cancel
								</Button>
								<Button
									type="submit"
									variant="primary"
									isDisabled={
										createEnvironment.isPending || updateEnvironment.isPending
									}
								>
									{isEditing ? "Update" : "Create"}
								</Button>
							</Modal.Footer>
						</Form>
					</Modal.Body>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Root>
	);
}
