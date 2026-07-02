import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
	PlusIcon,
	TrashSimpleIcon,
	EnvelopeSimpleIcon,
} from "@phosphor-icons/react";
import {
	Button,
	Table,
	Tooltip,
	Select,
	ListBox,
	Tabs,
	Spinner,
	toast,
	Chip,
} from "@heroui/react";
import {
	useOrganizationUsers,
	useOrgInvitations,
	useUpdateMemberRole,
	useRemoveMember,
	useCancelInvitation,
} from "@/features/organizations/api";
import { PermissionGuard } from "@/components/permission/PermissionGuard";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { formatDate } from "#/lib/date";
import UserAvatar from "#/components/user/user-avatar";
import { useContextStore } from "#/stores";
import { InviteMemberModal } from "@/features/organizations/InviteMemberModal";

export const Route = createFileRoute(
	"/_authenticated/projects/$projectSlug/_admin/members",
)({
	component: MembersPage,
});

const ROLES = [
	{ key: "admin", label: "Admin" },
	{ key: "editor", label: "Editor" },
	{ key: "viewer", label: "Viewer" },
];

function MembersPage() {
	const { selectedOrganization } = useContextStore();
	const orgId = selectedOrganization?.id ?? "";

	const { data: members, isLoading: membersLoading } = useOrganizationUsers(orgId);
	const { data: invitations, isLoading: invitationsLoading } = useOrgInvitations(orgId);

	const updateRole = useUpdateMemberRole();
	const removeMember = useRemoveMember();
	const cancelInvitation = useCancelInvitation();

	const [activeTab, setActiveTab] = useState("members");
	const [isInviteOpen, setIsInviteOpen] = useState(false);

	// Confirm states
	const [memberToRemove, setMemberToRemove] = useState<any>(null);
	const [invitationToCancel, setInvitationToCancel] = useState<any>(null);

	const handleRoleChange = async (memberId: string, role: "admin" | "editor" | "viewer") => {
		try {
			await updateRole.mutateAsync({ orgId, memberId, role });
			toast.success("Updated member role successfully");
		} catch {
			toast.danger("Failed to update member role");
		}
	};

	const handleRemoveMemberConfirm = async () => {
		if (!memberToRemove) return;
		try {
			await removeMember.mutateAsync({ orgId, memberId: memberToRemove.id });
			toast.success(`Removed member ${memberToRemove.name}`);
			setMemberToRemove(null);
		} catch {
			toast.danger("Failed to remove member");
		}
	};

	const handleCancelInvitationConfirm = async () => {
		if (!invitationToCancel) return;
		try {
			await cancelInvitation.mutateAsync({ orgId, invitationId: invitationToCancel.id });
			toast.success("Cancelled invitation successfully");
			setInvitationToCancel(null);
		} catch {
			toast.danger("Failed to cancel invitation");
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "pending":
				return "warning";
			case "accepted":
				return "success";
			case "rejected":
				return "danger";
			default:
				return "default";
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3 justify-between">
				<div>
					<h1 className="text-2xl font-bold text-foreground">Thành viên & Lời mời</h1>
					<p className="mt-1 text-sm text-default-500">
						Quản lý danh sách thành viên trong tổ chức {selectedOrganization?.name} và theo dõi các lời mời đã gửi.
					</p>
				</div>
				<PermissionGuard permission="member:create" mode="hide">
					<Button
						variant="primary"
						className="gap-2"
						onPress={() => setIsInviteOpen(true)}>
						<PlusIcon className="h-4 w-4" />
						Mời thành viên
					</Button>
				</PermissionGuard>
			</div>

			<Tabs selectedKey={activeTab} onSelectionChange={(key) => setActiveTab(key as string)}>
				<Tabs.ListContainer>
					<Tabs.List>
						<Tabs.Tab id="members">Thành viên ({members?.length ?? 0})</Tabs.Tab>
						<Tabs.Tab id="invitations">Lời mời đã gửi ({invitations?.length ?? 0})</Tabs.Tab>
						<Tabs.Indicator />
					</Tabs.List>
				</Tabs.ListContainer>

				<Tabs.Panel id="members" className="pt-4">
					{membersLoading ? (
						<div className="flex justify-center py-12">
							<Spinner size="md" />
						</div>
					) : !members || members.length === 0 ? (
						<div className="text-center py-12 text-default-500">
							Không tìm thấy thành viên nào.
						</div>
					) : (
						<Table aria-label="Danh sách thành viên">
							<Table.ScrollContainer>
								<Table.Content>
									<Table.Header>
										<Table.Column isRowHeader>Thành viên</Table.Column>
										<Table.Column>Vai trò</Table.Column>
										<Table.Column>Ngày tham gia</Table.Column>
										<Table.Column>Thao tác</Table.Column>
									</Table.Header>
									<Table.Body items={members}>
										{(member: any) => (
											<Table.Row key={member.id}>
												<Table.Cell>
													<div className="flex items-center gap-3">
														<UserAvatar user={member} size="sm" />
														<div className="flex flex-col">
															<span className="font-medium text-sm">
																{member.name}
															</span>
															<span className="text-xs text-default-500">
																{member.email}
															</span>
														</div>
													</div>
												</Table.Cell>
												<Table.Cell>
													<Select
														aria-label="Edit role"
														value={member.role}
														onChange={(key) => {
															if (key) {
																handleRoleChange(
																	member.id,
																	key as "admin" | "editor" | "viewer",
																);
															}
														}}
														variant="secondary"
														className="w-32">
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
												</Table.Cell>
												<Table.Cell>
													{member.createdAt ? (
														<Tooltip>
															<Tooltip.Trigger>
																<span className="text-sm text-default-500 cursor-default">
																	{formatDistanceToNow(
																		new Date(member.createdAt),
																		{
																			addSuffix: true,
																			locale: vi,
																		},
																	)}
																</span>
															</Tooltip.Trigger>
															<Tooltip.Content>
																{formatDate(member.createdAt)}
															</Tooltip.Content>
														</Tooltip>
													) : (
														<span className="text-sm text-default-400">
															--
														</span>
													)}
												</Table.Cell>
												<Table.Cell>
													<div className="flex items-center gap-2">
														<Button
															isIconOnly
															variant="ghost"
															size="sm"
															className="text-danger hover:bg-danger-soft/80"
															onPress={() => setMemberToRemove(member)}>
															<TrashSimpleIcon className="h-4 w-4" />
														</Button>
													</div>
												</Table.Cell>
											</Table.Row>
										)}
									</Table.Body>
								</Table.Content>
							</Table.ScrollContainer>
						</Table>
					)}
				</Tabs.Panel>

				<Tabs.Panel id="invitations" className="pt-4">
					{invitationsLoading ? (
						<div className="flex justify-center py-12">
							<Spinner size="md" />
						</div>
					) : !invitations || invitations.length === 0 ? (
						<div className="text-center py-12 text-default-500">
							Không tìm thấy lời mời nào đã gửi.
						</div>
					) : (
						<Table aria-label="Danh sách lời mời đã gửi">
							<Table.ScrollContainer>
								<Table.Content>
									<Table.Header>
										<Table.Column isRowHeader>Người nhận</Table.Column>
										<Table.Column>Vai trò</Table.Column>
										<Table.Column>Người gửi</Table.Column>
										<Table.Column>Ngày gửi</Table.Column>
										<Table.Column>Trạng thái</Table.Column>
										<Table.Column>Thao tác</Table.Column>
									</Table.Header>
									<Table.Body items={invitations}>
										{(inv: any) => (
											<Table.Row key={inv.id}>
												<Table.Cell>
													<div className="flex items-center gap-2">
														<EnvelopeSimpleIcon className="h-4 w-4 text-default-400" />
														<span className="text-sm font-medium">
															{inv.email}
														</span>
													</div>
												</Table.Cell>
												<Table.Cell>
													<span className="text-sm uppercase font-semibold text-default-600">
														{inv.role}
													</span>
												</Table.Cell>
												<Table.Cell>
													<div className="flex items-center gap-2">
														<UserAvatar user={inv.sender} size="sm" />
														<span className="text-sm text-default-700">
															{inv.sender.name}
														</span>
													</div>
												</Table.Cell>
												<Table.Cell>
													<Tooltip>
														<Tooltip.Trigger>
															<span className="text-sm text-default-500 cursor-default">
																{formatDistanceToNow(
																	new Date(inv.createdAt),
																	{
																		addSuffix: true,
																		locale: vi,
																	},
																)}
															</span>
														</Tooltip.Trigger>
														<Tooltip.Content>
															{formatDate(inv.createdAt)}
														</Tooltip.Content>
													</Tooltip>
												</Table.Cell>
												<Table.Cell>
													<Chip
														variant="soft"
														color={getStatusColor(inv.status)}
														size="sm">
														{inv.status}
													</Chip>
												</Table.Cell>
												<Table.Cell>
													{inv.status === "pending" && (
														<Button
															variant="danger-soft"
															size="sm"
															onPress={() => setInvitationToCancel(inv)}>
															Hủy
														</Button>
													)}
												</Table.Cell>
											</Table.Row>
										)}
									</Table.Body>
								</Table.Content>
							</Table.ScrollContainer>
						</Table>
					)}
				</Tabs.Panel>
			</Tabs>

			{/* Invite Modal */}
			<InviteMemberModal
				isOpen={isInviteOpen}
				onClose={() => setIsInviteOpen(false)}
				orgId={orgId}
			/>

			{/* Confirm Remove Member */}
			<ConfirmModal
				isOpen={!!memberToRemove}
				onOpenChange={(open) => !open && setMemberToRemove(null)}
				title="Xóa thành viên"
				description={
					<>
						Bạn có chắc chắn muốn xóa thành viên{" "}
						<span className="font-semibold text-foreground">
							{memberToRemove?.name}
						</span>{" "}
						khỏi tổ chức không? Thao tác này không thể hoàn tác.
					</>
				}
				variant="danger"
				confirmText="Xóa thành viên"
				cancelText="Hủy"
				requireRetypeContent={memberToRemove?.email}
				retypeLabel={`Nhập email "${memberToRemove?.email}" để xác nhận`}
				onConfirm={handleRemoveMemberConfirm}
			/>

			{/* Confirm Cancel Invitation */}
			<ConfirmModal
				isOpen={!!invitationToCancel}
				onOpenChange={(open) => !open && setInvitationToCancel(null)}
				title="Hủy lời mời"
				description={
					<>
						Bạn có chắc chắn muốn hủy lời mời gửi tới{" "}
						<span className="font-semibold text-foreground">
							{invitationToCancel?.email}
						</span>{" "}
						không?
					</>
				}
				variant="warning"
				confirmText="Hủy lời mời"
				cancelText="Quay lại"
				onConfirm={handleCancelInvitationConfirm}
			/>
		</div>
	);
}
