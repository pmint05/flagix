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
	toast,
} from "@heroui/react";
import { GearIcon, TrashIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { useUpdateOrganization, useDeleteOrganization } from "./api";
import { useContextStore } from "@/stores";
import { BaseSettingsModal } from "@/components/ui/settings-modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { useNavigate } from "@tanstack/react-router";
import { ActionButton } from "@/components/ui/action-button";

const orgSettingsSchema = z.object({
	name: z.string().min(1, "Name is required").max(255),
});

type OrgSettingsData = z.infer<typeof orgSettingsSchema>;

interface OrgSettingsModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function OrgSettingsModal({ isOpen, onClose }: OrgSettingsModalProps) {
	const org = useContextStore((s) => s.selectedOrganization);
	const updateOrg = useUpdateOrganization();
	const deleteOrg = useDeleteOrganization();
	const navigate = useNavigate();
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

	const {
		handleSubmit,
		control,
		formState: { errors },
	} = useForm<OrgSettingsData>({
		resolver: standardSchemaResolver(orgSettingsSchema),
		values: {
			name: org?.name ?? "",
		},
	});

	if (!org) return null;

	const onSubmit = async (data: OrgSettingsData) => {
		try {
			const updated = await updateOrg.mutateAsync({
				id: org.id,
				...data,
			});
			useContextStore.getState().setOrganization(updated);
			toast.success("Organization settings updated successfully");
		} catch {
			toast.danger("Failed to update organization settings");
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
							Update your organization settings.
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
								<Label>Organization Name</Label>
								<Input placeholder="My Organization" />
								{errors.name && <FieldError>{errors.name.message}</FieldError>}
							</TextField>
						)}
					/>

					<div className="pt-2">
						<ActionButton
							type="submit"
							variant="primary"
							isDisabled={updateOrg.isPending}
							isPending={updateOrg.isPending}>
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
							Irreversible actions for this organization.
						</p>
					</div>

					<div className="border border-danger/20 rounded-2xl p-4 bg-danger-soft/10 space-y-4">
						<div>
							<h4 className="text-sm font-bold text-foreground">
								Delete this organization
							</h4>
							<p className="text-xs text-default-400 mt-0.5">
								Permanently delete the organization, including all projects,
								feature flags, environments, and SDK keys. This action is
								irreversible.
							</p>
						</div>

						<Button
							variant="danger-soft"
							size="sm"
							onPress={() => setDeleteConfirmOpen(true)}>
							Delete Organization...
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
				title="Organization Settings"
				description={`Manage settings for organization "${org.name}"`}
				tabs={tabs}
			/>

			<ConfirmModal
				isOpen={deleteConfirmOpen}
				onOpenChange={setDeleteConfirmOpen}
				title="Delete Organization"
				description={
					<span>
						Are you sure you want to delete organization{" "}
						<strong className="text-foreground">{org.name}</strong>? This action
						is permanent and will delete all associated projects, environments,
						feature flags, SDK keys, and history.
					</span>
				}
				variant="danger"
				confirmText="Delete Organization"
				cancelText="Cancel"
				requireRetypeContent={org.name}
				retypeLabel="Retype organization name to confirm"
				onConfirm={async () => {
					try {
						await deleteOrg.mutateAsync(org.id);
						useContextStore.getState().setOrganization(null);
						useContextStore.getState().setProject(null);
						useContextStore.getState().setEnvironment(null);
						toast.success("Organization deleted successfully");
						void navigate({ to: "/orgSelect" });
						onClose();
					} catch (error: any) {
						toast.danger(error?.message || "Failed to delete organization");
					}
				}}
			/>
		</>
	);
}
