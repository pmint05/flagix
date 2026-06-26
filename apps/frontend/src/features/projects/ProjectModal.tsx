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
	TextArea,
	Drawer,
	toast,
} from "@heroui/react";
import { useCreateProject, useUpdateProject } from "./api";
import { useContextStore } from "@/stores";
import type { Project } from "@/types/project";
import { slugify } from "#/lib/utils";

const projectFormSchema = z.object({
	name: z.string().min(1, "Name is required").max(255),
	slug: z
		.string()
		.regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens")
		.min(1, "Slug is required")
		.max(100),
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
	const organizationId = useContextStore((s) => s.selectedOrganization?.id);

	const {
		register,
		handleSubmit,
		reset,
		setValue,
		formState: { errors },
	} = useForm<ProjectFormData>({
		resolver: zodResolver(projectFormSchema),
		defaultValues: {
			name: project?.name ?? "",
			slug: project?.slug ?? "",
			description: project?.description ?? "",
		},
	});

	useEffect(() => {
		if (isOpen) {
			reset({
				name: project?.name ?? "",
				slug: project?.slug ?? "",
				description: project?.description ?? "",
			});
		}
	}, [isOpen, project, reset]);

	console.log(errors);

	const onSubmit = async (data: ProjectFormData) => {
		try {
			if (isEditing) {
				await updateProject.mutateAsync({
					id: project.id,
					...data,
				});
				toast.success("Project updated successfully");
			} else {
				if (!organizationId) {
					toast.danger("No organization selected");
					return;
				}
				await createProject.mutateAsync(data);
				toast.success("Project created successfully");
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
								<TextField>
									<Label>Name</Label>
									<Input
										variant="secondary"
										{...register("name")}
										placeholder="My Project"
										onChange={(e) => {
											register("name").onChange(e);
											if (!isEditing) {
												setValue("slug", slugify(e.currentTarget.value));
											}
										}}
									/>
									{errors.name && (
										<FieldError>{errors.name.message}</FieldError>
									)}
								</TextField>

								<TextField name="slug" isInvalid={!!errors.slug}>
									<Label>Slug</Label>
									<Input
										variant="secondary"
										{...register("slug")}
										placeholder="my-project"
										disabled={isEditing}
									/>
									{errors.slug && (
										<FieldError>{errors.slug.message}</FieldError>
									)}
								</TextField>

								<TextField>
									<Label>Description</Label>
									<TextArea
										variant="secondary"
										{...register("description")}
										placeholder="Optional description"
										rows={3}
									/>
								</TextField>

								<Drawer.Footer>
									<Button variant="ghost" onPress={onClose}>
										Cancel
									</Button>
									<Button
										type="submit"
										variant="primary"
										isDisabled={
											createProject.isPending || updateProject.isPending
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
