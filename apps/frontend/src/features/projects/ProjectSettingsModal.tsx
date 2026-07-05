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
	toast,
} from "@heroui/react";
import { GearIcon, TrashIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { useUpdateProject, useDeleteProject } from "./api";
import { useContextStore } from "@/stores";
import { BaseSettingsModal } from "@/components/ui/settings-modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { useNavigate } from "@tanstack/react-router";
import { ActionButton } from "@/components/ui/action-button";

const projectSettingsSchema = z.object({
	name: z.string().min(1, "Name is required").max(255),
	description: z.string().optional(),
});

type ProjectSettingsData = z.infer<typeof projectSettingsSchema>;

interface ProjectSettingsModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function ProjectSettingsModal({
	isOpen,
	onClose,
}: ProjectSettingsModalProps) {
	const project = useContextStore((s) => s.selectedProject);
	const updateProject = useUpdateProject();
	const deleteProject = useDeleteProject();
	const navigate = useNavigate();
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

	const {
		handleSubmit,
		control,
		formState: { errors },
	} = useForm<ProjectSettingsData>({
		resolver: standardSchemaResolver(projectSettingsSchema),
		values: {
			name: project?.name ?? "",
			description: project?.description ?? "",
		},
	});

	if (!project) return null;

	const onSubmit = async (data: ProjectSettingsData) => {
		try {
			const updated = await updateProject.mutateAsync({
				id: project.id,
				...data,
			});
			useContextStore.getState().setProject(updated);
			toast.success("Project settings updated successfully");
		} catch {
			toast.danger("Failed to update project settings");
		}
	};

	const tabs = [
		{
			id: "general",
			label: "General",
			icon: GearIcon,
			content: (
				<Form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
					<div>
						<h3 className="text-lg font-bold text-foreground mb-1">
							General Settings
						</h3>
						<p className="text-xs text-default-400 mb-4">
							Update your project name and description.
						</p>
					</div>

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
								<Label>Project Name</Label>
								<Input placeholder="My Project" />
								{errors.name && <FieldError>{errors.name.message}</FieldError>}
							</TextField>
						)}
					/>

					<TextField variant="secondary" value={project.slug} isDisabled>
						<Label>Project Slug</Label>
						<Input />
						<p className="text-[11px] text-default-400 mt-1">
							The project slug cannot be changed because it is used in SDK keys
							and APIs.
						</p>
					</TextField>

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
								<TextArea placeholder="Optional project description" rows={3} />
								{errors.description && (
									<FieldError>{errors.description.message}</FieldError>
								)}
							</TextField>
						)}
					/>

					<div className="pt-2">
						<ActionButton
							type="submit"
							variant="primary"
							isDisabled={updateProject.isPending}
							isPending={updateProject.isPending}>
							Save Changes
						</ActionButton>
					</div>
				</Form>
			),
		},
		{
			id: "danger",
			label: "Danger Zone",
			icon: TrashIcon,
			content: (
				<div className="space-y-4 max-w-lg">
					<div>
						<h3 className="text-lg font-bold text-danger mb-1">Danger Zone</h3>
						<p className="text-xs text-default-400 mb-4">
							Irreversible and destructive actions for this project.
						</p>
					</div>

					<div className="border border-danger/20 rounded-2xl p-4 bg-danger-soft/10 space-y-4">
						<div>
							<h4 className="text-sm font-bold text-foreground">
								Delete this project
							</h4>
							<p className="text-xs text-default-400 mt-0.5">
								Permanently delete the project, including all feature flags,
								environments, and SDK keys. This action cannot be undone.
							</p>
						</div>

						<Button
							variant="danger-soft"
							size="sm"
							onPress={() => setDeleteConfirmOpen(true)}>
							Delete Project...
						</Button>
					</div>
				</div>
			),
		},
	];

	return (
		<>
			<BaseSettingsModal
				isOpen={isOpen}
				onClose={onClose}
				title="Project Settings"
				description={`Manage settings for project "${project.name}"`}
				tabs={tabs}
			/>

			<ConfirmModal
				isOpen={deleteConfirmOpen}
				onOpenChange={setDeleteConfirmOpen}
				title="Delete Project"
				description={
					<span>
						Are you sure you want to delete project{" "}
						<strong className="text-foreground">{project.name}</strong>? This
						action is permanent and will delete all associated environments,
						feature flags, SDK keys, and history.
					</span>
				}
				variant="danger"
				confirmText="Delete Project"
				cancelText="Cancel"
				requireRetypeContent={project.slug}
				retypeLabel="Retype project slug to confirm"
				onConfirm={async () => {
					try {
						await deleteProject.mutateAsync(project.id);
						useContextStore.getState().setProject(null);
						useContextStore.getState().setEnvironment(null);
						toast.success("Project deleted successfully");
						void navigate({ to: "/projects" });
						onClose();
					} catch (error: any) {
						toast.danger(error?.message || "Failed to delete project");
					}
				}}
			/>
		</>
	);
}
