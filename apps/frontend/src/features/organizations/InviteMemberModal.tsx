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
	Modal,
	toast,
	Select,
	ListBox,
} from "@heroui/react";
import { useCreateInvitation } from "./api";
import { ActionButton } from "#/components/ui/action-button";

const inviteMemberSchema = z.object({
	email: z.string().email("Invalid email address"),
	role: z.enum(["admin", "editor", "viewer"]),
});

type InviteMemberFormData = z.infer<typeof inviteMemberSchema>;

interface InviteMemberModalProps {
	isOpen: boolean;
	onClose: () => void;
	orgId: string;
}

const ROLES = [
	{ key: "admin", label: "Admin" },
	{ key: "editor", label: "Editor" },
	{ key: "viewer", label: "Viewer" },
];

export function InviteMemberModal({
	isOpen,
	onClose,
	orgId,
}: InviteMemberModalProps) {
	const createInvitation = useCreateInvitation();

	const {
		handleSubmit,
		control,
		formState: { errors },
		reset,
	} = useForm<InviteMemberFormData>({
		resolver: standardSchemaResolver(inviteMemberSchema),
		defaultValues: {
			email: "",
			role: "viewer",
		},
	});

	const onSubmit = async (data: InviteMemberFormData) => {
		try {
			await createInvitation.mutateAsync({
				orgId,
				...data,
			});
			toast.success("Invitation sent successfully");
			reset();
			onClose();
		} catch {
			toast.danger("Failed to send invitation");
		}
	};

	return (
		<Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
			<Modal.Backdrop>
				<Modal.Container>
					<Modal.Dialog className="max-w-md">
						<Modal.CloseTrigger />
						<Modal.Header>
							<Modal.Heading>Invite Member</Modal.Heading>
						</Modal.Header>
						<Modal.Body>
							<Form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pb-4">
								<Controller
									name="email"
									control={control}
									render={({ field }) => (
										<TextField
											autoFocus
											isInvalid={!!errors.email}
											variant="secondary"
											value={field.value}
											onChange={field.onChange}
											onBlur={field.onBlur}>
											<Label>Email</Label>
											<Input placeholder="user@example.com" type="email" />
											{errors.email && (
												<FieldError>{errors.email.message}</FieldError>
											)}
										</TextField>
									)}
								/>

								<Controller
									name="role"
									control={control}
									render={({ field }) => (
										<Select
											value={field.value}
											onChange={(key) => {
												if (key) field.onChange(key);
											}}
											variant="secondary">
											<Label>Role</Label>
											<Select.Trigger>
												<Select.Value />
												<Select.Indicator />
											</Select.Trigger>
											<Select.Popover>
												<ListBox items={ROLES}>
													{(r: any) => (
														<ListBox.Item
															textValue={r.label}
															id={r.key}
															key={r.key}>
															{r.label}
														</ListBox.Item>
													)}
												</ListBox>
											</Select.Popover>
										</Select>
									)}
								/>

								<Modal.Footer className="px-0 pt-4">
									<Button variant="ghost" onPress={onClose}>
										Cancel
									</Button>
									<ActionButton
										isPending={createInvitation.isPending}
										type="submit"
										variant="primary"
										isDisabled={createInvitation.isPending}>
										Send Invitation
									</ActionButton>
								</Modal.Footer>
							</Form>
						</Modal.Body>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>
		</Modal>
	);
}
