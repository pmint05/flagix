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
	toast,
	Chip,
	Skeleton,
} from "@heroui/react";
import {
	useOrganizationUsers,
	useOrgInvitations,
	useUpdateMemberRole,
	useRemoveMember,
	useCancelInvitation,
} from "@/features/organizations/api";
import { PermissionGuard } from "@/components/permission/PermissionGuard";
import { useHasPermission } from "@/hooks/usePermission";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { formatDistanceToNow } from "date-fns";
import { formatDate } from "#/lib/date";
import UserAvatar from "#/components/user/user-avatar";
import { useContextStore } from "#/stores";
import { InviteMemberModal } from "@/features/organizations/InviteMemberModal";

export const Route = createFileRoute("/_authenticated/members")({
	component: MembersPage,
	staticData: {
		hideEnvironmentSwitcher: true,
	},
});

const ROLES = [
	{ key: "admin", label: "Admin" },
	{ key: "editor", label: "Editor" },
	{ key: "viewer", label: "Viewer" },
];

function MembersPageContent() {
	const { selectedOrganization } = useContextStore();
	const orgId = selectedOrganization?.id ?? "";

	const canInvite = useHasPermission("member:create");

	const { data: members, isLoading: membersLoading } =
		useOrganizationUsers(orgId);
	const { data: invitations, isLoading: invitationsLoading } =
		useOrgInvitations(orgId);

	const updateRole = useUpdateMemberRole();
	const removeMember = useRemoveMember();
	const cancelInvitation = useCancelInvitation();

	const [activeTab, setActiveTab] = useState("members");
	const [isInviteOpen, setIsInviteOpen] = useState(false);

	// Confirm states
	const [memberToRemove, setMemberToRemove] = useState<any>(null);
	const [invitationToCancel, setInvitationToCancel] = useState<any>(null);

	const handleRoleChange = async (
		memberId: string,
		role: "admin" | "editor" | "viewer",
	) => {
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
			await cancelInvitation.mutateAsync({
				orgId,
				invitationId: invitationToCancel.id,
			});
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

	const renderMembersTable = () => {
		if (!membersLoading && (!members || members.length === 0)) {
			return <div className="text-center py-12">No members found.</div>;
		}

		return (
			<Table aria-label="Members List">
				<Table.ScrollContainer>
					<Table.Content>
						<Table.Header>
							<Table.Column isRowHeader>Member</Table.Column>
							<Table.Column>Role</Table.Column>
							<Table.Column>Joined</Table.Column>
							{canInvite && <Table.Column>Actions</Table.Column>}
						</Table.Header>
						<Table.Body>
							{membersLoading
								? Array.from({ length: 3 }).map((_, i) => (
										<Table.Row key={`members-skeleton-${i}`}>
											<Table.Cell>
												<div className="flex items-center gap-3">
													<Skeleton className="h-8 w-8 rounded-full" />
													<div className="flex flex-col gap-1.5">
														<Skeleton className="h-4 w-28 rounded" />
														<Skeleton className="h-3 w-40 rounded" />
													</div>
												</div>
											</Table.Cell>
											<Table.Cell>
												<Skeleton className="h-8 w-32 rounded-lg" />
											</Table.Cell>
											<Table.Cell>
												<Skeleton className="h-4 w-24 rounded" />
											</Table.Cell>
											{canInvite && (
												<Table.Cell>
													<Skeleton className="h-8 w-8 rounded-md" />
												</Table.Cell>
											)}
										</Table.Row>
									))
								: members?.map((member: any) => (
										<Table.Row key={member.id}>
											<Table.Cell>
												<div className="flex items-center gap-3">
													<UserAvatar user={member} size="sm" />
													<div className="flex flex-col">
														<span className="font-medium text-sm">
															{member.name}
														</span>
														<span className="text-xs">{member.email}</span>
													</div>
												</div>
											</Table.Cell>
											<Table.Cell>
												{canInvite ? (
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
												) : (
													<span className="text-sm font-medium capitalize">
														{ROLES.find((r) => r.key === member.role)?.label ??
															member.role}
													</span>
												)}
											</Table.Cell>
											<Table.Cell>
												{member.createdAt ? (
													<Tooltip>
														<Tooltip.Trigger>
															<span className="text-sm cursor-default">
																{formatDistanceToNow(
																	new Date(member.createdAt),
																	{
																		addSuffix: true,
																	},
																)}
															</span>
														</Tooltip.Trigger>
														<Tooltip.Content>
															{formatDate(member.createdAt)}
														</Tooltip.Content>
													</Tooltip>
												) : (
													<span className="text-sm">--</span>
												)}
											</Table.Cell>
											{canInvite && (
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
											)}
										</Table.Row>
									))}
						</Table.Body>
					</Table.Content>
				</Table.ScrollContainer>
			</Table>
		);
	};

	const renderInvitationsTable = () => {
		if (!invitationsLoading && (!invitations || invitations.length === 0)) {
			return (
				<div className="text-center py-12">No sent invitations found.</div>
			);
		}

		return (
			<Table aria-label="Sent Invitations List">
				<Table.ScrollContainer>
					<Table.Content>
						<Table.Header>
							<Table.Column isRowHeader>Invitee</Table.Column>
							<Table.Column>Role</Table.Column>
							<Table.Column>Sender</Table.Column>
							<Table.Column>Sent</Table.Column>
							<Table.Column>Status</Table.Column>
							<Table.Column>Actions</Table.Column>
						</Table.Header>
						<Table.Body>
							{invitationsLoading
								? Array.from({ length: 3 }).map((_, i) => (
										<Table.Row key={`invitations-skeleton-${i}`}>
											<Table.Cell>
												<div className="flex items-center gap-2">
													<Skeleton className="h-4 w-4 rounded-full" />
													<Skeleton className="h-4 w-48 rounded" />
												</div>
											</Table.Cell>
											<Table.Cell>
												<Skeleton className="h-4 w-12 rounded" />
											</Table.Cell>
											<Table.Cell>
												<div className="flex items-center gap-2">
													<Skeleton className="h-8 w-8 rounded-full" />
													<Skeleton className="h-4 w-24 rounded" />
												</div>
											</Table.Cell>
											<Table.Cell>
												<Skeleton className="h-4 w-24 rounded" />
											</Table.Cell>
											<Table.Cell>
												<Skeleton className="h-6 w-16 rounded-full" />
											</Table.Cell>
											<Table.Cell>
												<Skeleton className="h-8 w-12 rounded-md" />
											</Table.Cell>
										</Table.Row>
									))
								: invitations?.map((inv: any) => (
										<Table.Row key={inv.id}>
											<Table.Cell>
												<div className="flex items-center gap-2">
													<EnvelopeSimpleIcon className="h-4 w-4" />
													<span className="text-sm font-medium">
														{inv.email}
													</span>
												</div>
											</Table.Cell>
											<Table.Cell>
												<span className="text-sm uppercase font-semibold">
													{inv.role}
												</span>
											</Table.Cell>
											<Table.Cell>
												<div className="flex items-center gap-2">
													<UserAvatar user={inv.sender} size="sm" />
													<span className="text-sm">{inv.sender.name}</span>
												</div>
											</Table.Cell>
											<Table.Cell>
												<Tooltip>
													<Tooltip.Trigger>
														<span className="text-sm cursor-default">
															{formatDistanceToNow(new Date(inv.createdAt), {
																addSuffix: true,
															})}
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
														Cancel
													</Button>
												)}
											</Table.Cell>
										</Table.Row>
									))}
						</Table.Body>
					</Table.Content>
				</Table.ScrollContainer>
			</Table>
		);
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3 justify-between">
				<div>
					<h1 className="text-2xl font-bold text-foreground">
						{canInvite ? "Members & Invitations" : "Members"}
					</h1>
					<p className="mt-1 text-sm">
						{canInvite
							? `Manage organization members and track sent invitations for ${selectedOrganization?.name}.`
							: `View organization members for ${selectedOrganization?.name}.`}
					</p>
				</div>
				{canInvite && (
					<Button
						variant="primary"
						className="gap-2"
						onPress={() => setIsInviteOpen(true)}>
						<PlusIcon className="h-4 w-4" />
						Invite Member
					</Button>
				)}
			</div>

			{canInvite ? (
				<Tabs
					selectedKey={activeTab}
					onSelectionChange={(key) => setActiveTab(key as string)}
					variant="secondary"
					className="w-full">
					<Tabs.ListContainer>
						<Tabs.List
							aria-label="Members tabs"
							className="gap-6 w-full relative rounded-none p-0 border-b border-divider *:data-[selected=true]:text-primary *:h-12 *:w-fit *:px-0">
							<Tabs.Tab id="members">
								Members ({members?.length ?? 0})
								<Tabs.Indicator />
							</Tabs.Tab>
							<Tabs.Tab id="invitations">
								Sent Invitations ({invitations?.length ?? 0})
								<Tabs.Indicator />
							</Tabs.Tab>
						</Tabs.List>
					</Tabs.ListContainer>

					<Tabs.Panel id="members" className="pt-4">
						{renderMembersTable()}
					</Tabs.Panel>

					<Tabs.Panel id="invitations" className="pt-4">
						{renderInvitationsTable()}
					</Tabs.Panel>
				</Tabs>
			) : (
				<div className="pt-4">{renderMembersTable()}</div>
			)}

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
				title="Remove Member"
				description={
					<>
						Are you sure you want to remove member{" "}
						<span className="font-semibold text-foreground">
							{memberToRemove?.name}
						</span>{" "}
						from the organization? This action cannot be undone.
					</>
				}
				variant="danger"
				confirmText="Remove Member"
				cancelText="Cancel"
				requireRetypeContent={memberToRemove?.email}
				retypeLabel={`Type email "${memberToRemove?.email}" to confirm`}
				onConfirm={handleRemoveMemberConfirm}
			/>

			{/* Confirm Cancel Invitation */}
			<ConfirmModal
				isOpen={!!invitationToCancel}
				onOpenChange={(open) => !open && setInvitationToCancel(null)}
				title="Cancel Invitation"
				description={
					<>
						Are you sure you want to cancel the invitation sent to{" "}
						<span className="font-semibold text-foreground">
							{invitationToCancel?.email}
						</span>
						?
					</>
				}
				variant="warning"
				confirmText="Cancel Invitation"
				cancelText="Go Back"
				onConfirm={handleCancelInvitationConfirm}
			/>
		</div>
	);
}

export function MembersPage() {
	return (
		<PermissionGuard
			permission="member:view"
			mode="hide"
			fallback={
				<div className="flex flex-col items-center justify-center h-[50vh] text-center p-6">
					<h2 className="text-xl font-semibold text-foreground mb-2">
						Access Denied
					</h2>
					<p className="max-w-sm">
						You do not have permission to view organization members. Please
						contact your organization administrator.
					</p>
				</div>
			}>
			<MembersPageContent />
		</PermissionGuard>
	);
}
