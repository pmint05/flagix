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
	ListBox,
	Drawer,
	toast,
} from "@heroui/react";
import { useCreateEnvironment, useUpdateEnvironment } from "./api";
import { useContextStore } from "@/stores";
import type { Environment } from "@/types/environment";
import { ApiError } from "#/lib/errors";

const envFormSchema = z.object({
	name: z.string().trim().min(1, "Name is required").max(255),
	type: z.enum(["development", "staging", "production", "custom"]),
	description: z.string().optional(),
});

type EnvFormData = z.infer<typeof envFormSchema>;
import { ENV_TYPES } from "./constants";

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
		values: {
			name: environment?.name ?? "",
			type: environment?.type ?? "development",
			description: environment?.description ?? "",
		},
	});

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
		} catch (error) {
			if (error instanceof ApiError) {
				toast.danger(
					`Error to ${isEditing ? "update" : "create"} environment`,
					{
						description: error.message,
					},
				);
			} else {
				toast.danger(
					isEditing
						? "Failed to update environment"
						: "Failed to create environment",
				);
			}
		}
	};

	return (
		<Drawer isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
			<Drawer.Backdrop>
				<Drawer.Content placement="right">
					<Drawer.Dialog>
						<Drawer.Header>
							<Drawer.Heading>
								{isEditing ? "Edit Environment" : "Create Environment"}
								<Drawer.CloseTrigger />
							</Drawer.Heading>
						</Drawer.Header>
						<Drawer.Body>
							<Form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
								<Controller
									name="name"
									control={control}
									render={({ field }) => (
										<TextField
											isInvalid={!!errors.name}
											variant="secondary"
											value={field.value}
											onChange={field.onChange}
											onBlur={field.onBlur}>
											<Label>Name</Label>
											<Input placeholder="e.g. Production" />
											{errors.name && (
												<FieldError>{errors.name.message}</FieldError>
											)}
										</TextField>
									)}
								/>

								<Controller
									name="type"
									control={control}
									render={({ field }) => (
										<Select
											value={field.value as string}
											onChange={(key) => {
												if (key) field.onChange(key);
											}}
											variant="secondary">
											<Label>Type</Label>
											<Select.Trigger>
												<Select.Value />
												<Select.Indicator />
											</Select.Trigger>
											<Select.Popover>
												<ListBox>
													{ENV_TYPES.map((t) => (
														<ListBox.Item
															textValue={t.label}
															id={t.key}
															key={t.key}>
															{t.label}
														</ListBox.Item>
													))}
												</ListBox>
											</Select.Popover>
											{errors.type && (
												<FieldError>{errors.type.message}</FieldError>
											)}
										</Select>
									)}
								/>

								<Controller
									name="description"
									control={control}
									render={({ field }) => (
										<TextField
											isInvalid={!!errors.description}
											variant="secondary"
											value={field.value}
											onChange={field.onChange}
											onBlur={field.onBlur}>
											<Label>Description</Label>
											<TextArea placeholder="Optional description" rows={3} />
										</TextField>
									)}
								/>

								<Drawer.Footer>
									<Button variant="outline" onPress={onClose}>
										Cancel
									</Button>
									<Button
										type="submit"
										variant="primary"
										isDisabled={
											createEnvironment.isPending || updateEnvironment.isPending
										}>
										{isEditing ? "Update" : "Create"}
									</Button>
								</Drawer.Footer>
							</Form>
						</Drawer.Body>
					</Drawer.Dialog>
				</Drawer.Content>
			</Drawer.Backdrop>
		</Drawer>
	);
}
