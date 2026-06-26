import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
	Button,
	Form,
	FieldError,
	Label,
	TextField,
	Input,
	Drawer,
	toast,
} from "@heroui/react";
import { useCreateOrganization, useUpdateOrganization } from "./api";
import type { Organization } from "@/types";

const organizationFormSchema = z.object({
	name: z.string().min(1, "Name is required").max(255),
});

type OrganizationFormData = z.infer<typeof organizationFormSchema>;

interface OrganizationModalProps {
	isOpen: boolean;
	onClose: () => void;
	organization?: Organization;
}

export function OrganizationModal({ isOpen, onClose, organization }: OrganizationModalProps) {
	const isEditing = !!organization;
	const createOrganization = useCreateOrganization();
	const updateOrganization = useUpdateOrganization();

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<OrganizationFormData>({
		resolver: zodResolver(organizationFormSchema),
		defaultValues: {
			name: organization?.name ?? "",
		},
	});

	useEffect(() => {
		if (isOpen) {
			reset({
				name: organization?.name ?? "",
			});
		}
	}, [isOpen, organization, reset]);

	const onSubmit = async (data: OrganizationFormData) => {
		try {
			if (isEditing) {
				await updateOrganization.mutateAsync({
					id: organization.id,
					...data,
				});
				toast.success("Organization updated successfully");
			} else {
				await createOrganization.mutateAsync(data);
				toast.success("Organization created successfully");
			}
			onClose();
		} catch {
			toast.danger(
				isEditing ? "Failed to update organization" : "Failed to create organization",
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
								{isEditing ? "Edit Organization" : "Create Organization"}
							</Drawer.Heading>
						</Drawer.Header>
						<Drawer.Body>
							<Form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
								<TextField>
									<Label>Name</Label>
									<Input
										variant="secondary"
										{...register("name")}
										placeholder="My Organization"
									/>
									{errors.name && (
										<FieldError>{errors.name.message}</FieldError>
									)}
								</TextField>

								<Drawer.Footer>
									<Button variant="ghost" onPress={onClose}>
										Cancel
									</Button>
									<Button
										type="submit"
										variant="primary"
										isDisabled={
											createOrganization.isPending || updateOrganization.isPending
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
