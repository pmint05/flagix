import { useForm, Controller } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import {
	Button,
	Form,
	FieldError,
	Label,
	TextField,
	Input,
	TextArea,
	Drawer,
	toast,
} from "@heroui/react";
import { useCreateProject, useUpdateProject } from "./api";
import { useContextStore } from "@/stores";
import type { Project } from "@/types/project";
import { PermissionGuard } from "@/components/permission/PermissionGuard";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ActionButton } from "#/components/ui/action-button";

import { SlugInput, slugValidation } from "#/components/ui/slug-input";

const projectFormSchema = z.object({
	name: z.string().min(1, "Name is required").max(255),
	slug: slugValidation,
	description: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectFormSchema>;

interface ProjectModalProps {
	isOpen: boolean;
	onClose: () => void;
	project?: Project;
}

export function ProjectModal({ isOpen, onClose, project }: ProjectModalProps) {
	const isEditing = !!project;
	const createProject = useCreateProject();
	const updateProject = useUpdateProject();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const organizationId = useContextStore((s) => s.selectedOrganization?.id);

	const {
		handleSubmit,
		setValue,
		control,
		watch,
		formState: { errors },
	} = useForm<ProjectFormData>({
		resolver: standardSchemaResolver(projectFormSchema),
		values: {
			name: project?.name ?? "",
			slug: project?.slug ?? "",
			description: project?.description ?? "",
		},
	});

	const watchedName = watch("name");

	const onSubmit = async (data: ProjectFormData) => {
		try {
			if (isEditing) {
				const updated = await updateProject.mutateAsync({
					id: project.id,
					...data,
				});
				toast.success("Project updated successfully");
				
				const currentSelected = useContextStore.getState().selectedProject;
				if (currentSelected && currentSelected.id === project.id) {
					useContextStore.getState().setProject(updated);
				}
			} else {
				if (!organizationId) {
					toast.danger("No organization selected");
					return;
				}
				const newProject = await createProject.mutateAsync(data);
				toast.success("Project created successfully");

				// Invalidate all child queries for safety
				queryClient.invalidateQueries({ queryKey: ["environments"] });
				queryClient.invalidateQueries({ queryKey: ["flags"] });
				queryClient.invalidateQueries({ queryKey: ["sdk-keys"] });

				useContextStore.getState().setProject(newProject);
				void navigate({
					to: "/projects/$projectSlug/flags",
					params: { projectSlug: newProject.slug },
				});
			}
			onClose();
		} catch {
			toast.danger(
				isEditing ? "Failed to update project" : "Failed to create project",
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
								{isEditing ? "Edit Project" : "Create Project"}
							</Drawer.Heading>
						</Drawer.Header>
						<Drawer.Body>
							<Form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
								<Controller
									name="name"
									control={control}
									render={({ field }) => (
										<TextField
											autoFocus
											isInvalid={!!errors.name}
											variant="secondary"
											value={field.value}
											onChange={field.onChange}
											onBlur={field.onBlur}>
											<Label>Name</Label>
											<Input placeholder="My Project" />
											{errors.name && (
												<FieldError>{errors.name.message}</FieldError>
											)}
										</TextField>
									)}
								/>

								<Controller
									name="slug"
									control={control}
									render={({ field }) => (
										<SlugInput
											value={field.value}
											onChange={field.onChange}
											onBlur={field.onBlur}
											nameValue={watchedName}
											error={errors.slug?.message}
											label="Slug"
											placeholder="my-project"
											isDisabled={isEditing}
										/>
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
											{errors.description && (
												<FieldError>{errors.description.message}</FieldError>
											)}
										</TextField>
									)}
								/>

								<Drawer.Footer>
									<Button variant="ghost" onPress={onClose}>
										Cancel
									</Button>
									<PermissionGuard
										permission={isEditing ? "project:edit" : "project:create"}
										mode="disable">
										<ActionButton
											type="submit"
											variant="primary"
											isDisabled={
												createProject.isPending || updateProject.isPending
											}
											isPending={
												createProject.isPending || updateProject.isPending
											}>
											{isEditing ? "Update" : "Create"}
										</ActionButton>
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
