import { Modal, Button, toast, Spinner } from "@heroui/react";
import {
	useUserInvitations,
	useAcceptInvitation,
	useRejectInvitation,
} from "./api";
import { ActionButton } from "#/components/ui/action-button";

interface InvitationAlertModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function InvitationAlertModal({
	isOpen,
	onClose,
}: InvitationAlertModalProps) {
	const { data: invitations, isLoading } = useUserInvitations();
	const acceptInvitation = useAcceptInvitation();
	const rejectInvitation = useRejectInvitation();

	const handleAccept = async (id: string) => {
		try {
			await acceptInvitation.mutateAsync(id);
			toast.success("Accepted invitation successfully");
			if (invitations && invitations.length <= 1) {
				onClose();
			}
		} catch {
			toast.danger("Failed to accept invitation");
		}
	};

	const handleReject = async (id: string) => {
		try {
			await rejectInvitation.mutateAsync(id);
			toast.success("Rejected invitation");
			if (invitations && invitations.length <= 1) {
				onClose();
			}
		} catch {
			toast.danger("Failed to reject invitation");
		}
	};

	const roleLabel = (role: string) => {
		switch (role) {
			case "admin":
				return "Admin";
			case "editor":
				return "Editor";
			default:
				return "Viewer";
		}
	};

	return (
		<Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
			<Modal.Backdrop>
				<Modal.Container>
					<Modal.Dialog className="max-w-md">
						<Modal.CloseTrigger />
						<Modal.Header>
							<Modal.Heading>Lời mời tham gia tổ chức</Modal.Heading>
						</Modal.Header>
						<Modal.Body className="py-4 space-y-4">
							{isLoading ? (
								<div className="flex items-center justify-center py-8">
									<Spinner size="md" />
								</div>
							) : !invitations || invitations.length === 0 ? (
								<p className="text-default-500 text-center py-6 text-sm">
									Bạn không có lời mời nào chưa giải quyết.
								</p>
							) : (
								<div className="space-y-4 divide-y divide-divider">
									{invitations.map((inv, idx) => (
										<div
											key={inv.id}
											className={`flex flex-col space-y-3 ${idx > 0 ? "pt-4" : ""}`}>
											<p className="text-default-700 text-sm leading-relaxed">
												<span className="font-semibold text-foreground">
													{inv.sender.name}
												</span>{" "}
												đã mời bạn làm{" "}
												<span className="font-semibold text-primary">
													{roleLabel(inv.role)}
												</span>{" "}
												trong tổ chức{" "}
												<span className="font-semibold text-foreground">
													{inv.organization.name}
												</span>
												.
											</p>
											<div className="flex items-center justify-end gap-2">
												<ActionButton
													variant="danger-soft"
													size="sm"
													isPending={rejectInvitation.isPending}
													isDisabled={
														acceptInvitation.isPending ||
														rejectInvitation.isPending
													}
													onPress={() => handleReject(inv.id)}>
													Từ chối
												</ActionButton>
												<ActionButton
													variant="primary"
													size="sm"
													isPending={acceptInvitation.isPending}
													isDisabled={
														acceptInvitation.isPending ||
														rejectInvitation.isPending
													}
													onPress={() => handleAccept(inv.id)}>
													Chấp nhận
												</ActionButton>
											</div>
										</div>
									))}
								</div>
							)}
						</Modal.Body>
						<Modal.Footer>
							<Button variant="ghost" onPress={onClose}>
								Đóng
							</Button>
						</Modal.Footer>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>
		</Modal>
	);
}
