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
	Drawer,
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
		resolver: zodResolver(inviteMemberSchema),
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
		<Drawer isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
			<Drawer.Backdrop>
				<Drawer.Content placement="right">
					<Drawer.Dialog>
						<Drawer.Header>
							<Drawer.Heading>Invite Member</Drawer.Heading>
						</Drawer.Header>
						<Drawer.Body>
							<Form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

								<Drawer.Footer>
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
								</Drawer.Footer>
							</Form>
						</Drawer.Body>
					</Drawer.Dialog>
				</Drawer.Content>
			</Drawer.Backdrop>
		</Drawer>
	);
}
