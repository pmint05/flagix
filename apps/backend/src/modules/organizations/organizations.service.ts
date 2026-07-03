import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { OrganizationsRepository } from './organizations.repository';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { getActorId } from '@/common/audit/audit-context';
import { resolveOrganizationAction } from '@/common/audit/resolve-action';
import { sanitizeOrganization } from '@/common/audit/sanitize';
import { slugify } from '@/common/utils/slug';
import type {
  CreateOrganizationDto,
  UpdateOrganizationDto,
} from './dto/create-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly orgRepo: OrganizationsRepository,
    @Optional() private readonly auditLogsService?: AuditLogsService,
  ) {}

  async create(input: CreateOrganizationDto, actorId: string) {
    const slug = input.slug ?? slugify(input.name);

    const existing = await this.orgRepo.findBySlug(slug);
    if (existing) {
      throw new ConflictException('Organization slug already exists');
    }

    const org = await this.orgRepo.create({ ...input, slug }, actorId);

    await this.orgRepo.addMember(org.id, actorId, 'admin');

    if (this.auditLogsService) {
      await this.auditLogsService.recordChange({
        organizationId: org.id,
        entityType: 'organization',
        entityId: org.id,
        before: null,
        after: org,
        resolveAction: resolveOrganizationAction,
        sanitize: sanitizeOrganization,
      });
    }

    return { ...org, role: 'admin' as const };
  }

  async findOneForUser(id: string, userId: string) {
    const org = await this.orgRepo.findById(id);
    if (!org) throw new NotFoundException('Organization not found');

    const membership = await this.orgRepo.findMembership(id, userId);
    if (!membership) throw new NotFoundException('Organization not found');

    return { ...org, role: membership.role };
  }

  async findAllForUser(userId: string) {
    return this.orgRepo.findAllForUser(userId);
  }

  async findUsers(orgId: string, requesterRole?: string) {
    const users = await this.orgRepo.findUsers(orgId);
    const maskEmail = requesterRole === 'viewer';
    return users.map((u) => ({
      ...u,
      email: maskEmail ? null : u.email,
    }));
  }

  async update(id: string, input: UpdateOrganizationDto) {
    const org = await this.orgRepo.findById(id);
    if (!org) throw new NotFoundException('Organization not found');

    if (input.slug) {
      const existing = await this.orgRepo.findBySlug(input.slug);
      if (existing && existing.id !== id) {
        throw new ConflictException('Organization slug already exists');
      }
    }

    const actorId = getActorId();
    const updated = await this.orgRepo.update(id, input, actorId);
    if (!updated) throw new NotFoundException('Organization not found');

    if (this.auditLogsService) {
      await this.auditLogsService.recordChange({
        organizationId: id,
        entityType: 'organization',
        entityId: id,
        before: org,
        after: updated,
        resolveAction: resolveOrganizationAction,
        sanitize: sanitizeOrganization,
      });
    }

    const membership = actorId
      ? await this.orgRepo.findMembership(id, actorId)
      : null;
    const role = membership?.role ?? 'viewer';

    return { ...updated, role };
  }

  async remove(id: string) {
    const org = await this.orgRepo.findById(id);
    if (!org) throw new NotFoundException('Organization not found');

    const actorId = getActorId();
    const deleted = await this.orgRepo.softDelete(id, actorId);

    if (this.auditLogsService) {
      await this.auditLogsService.recordChange({
        organizationId: id,
        entityType: 'organization',
        entityId: id,
        before: org,
        after: deleted,
        resolveAction: resolveOrganizationAction,
        sanitize: sanitizeOrganization,
      });
    }

    return { success: true };
  }

  async inviteMember(
    orgId: string,
    invitedBy: string,
    email: string,
    role: 'admin' | 'editor' | 'viewer',
  ) {
    const normalizedEmail = email.trim().toLowerCase();

    // Check if they are already a member
    const targetUser = await this.orgRepo.findUserByEmail(normalizedEmail);
    if (targetUser) {
      const membership = await this.orgRepo.findMembership(orgId, targetUser.id);
      if (membership) {
        throw new ConflictException('User is already a member of this organization');
      }
    }

    // Check if there is already a pending invitation
    const existingInv = await this.orgRepo.findInvitationByOrgAndEmail(orgId, normalizedEmail);
    if (existingInv) {
      return { success: true, message: 'Invitation sent successfully' };
    }

    // Create the invitation in the database (works whether user exists or not)
    await this.orgRepo.createInvitation(orgId, invitedBy, normalizedEmail, role);

    return { success: true, message: 'Invitation sent successfully' };
  }

  async getSentInvitations(orgId: string) {
    return this.orgRepo.findInvitationsByOrg(orgId);
  }

  async cancelInvitation(orgId: string, invitationId: string) {
    const invitation = await this.orgRepo.findInvitationById(invitationId);
    if (!invitation || invitation.organizationId !== orgId) {
      throw new NotFoundException('Invitation not found');
    }
    if (invitation.status !== 'pending') {
      throw new BadRequestException('Only pending invitations can be cancelled');
    }

    await this.orgRepo.updateInvitationStatus(invitationId, 'cancelled');
    return { success: true };
  }

  async getUserPendingInvitations(email: string) {
    return this.orgRepo.findPendingInvitationsByEmail(email);
  }

  async acceptInvitation(userId: string, email: string, invitationId: string) {
    const invitation = await this.orgRepo.findInvitationById(invitationId);
    if (!invitation || invitation.email !== email) {
      throw new NotFoundException('Invitation not found');
    }
    if (invitation.status !== 'pending') {
      throw new BadRequestException('Invitation is no longer pending');
    }

    await this.orgRepo.updateInvitationStatus(invitationId, 'accepted');
    await this.orgRepo.addMember(invitation.organizationId, userId, invitation.role);

    return { success: true };
  }

  async rejectInvitation(email: string, invitationId: string) {
    const invitation = await this.orgRepo.findInvitationById(invitationId);
    if (!invitation || invitation.email !== email) {
      throw new NotFoundException('Invitation not found');
    }
    if (invitation.status !== 'pending') {
      throw new BadRequestException('Invitation is no longer pending');
    }

    await this.orgRepo.updateInvitationStatus(invitationId, 'rejected');
    return { success: true };
  }

  async updateMemberRole(
    orgId: string,
    memberId: string,
    role: 'admin' | 'editor' | 'viewer',
  ) {
    const org = await this.orgRepo.findById(orgId);
    if (!org) throw new NotFoundException('Organization not found');

    const updated = await this.orgRepo.updateMemberRole(memberId, role);
    if (!updated) throw new NotFoundException('Member not found');

    return updated;
  }

  async removeMember(orgId: string, memberId: string) {
    const org = await this.orgRepo.findById(orgId);
    if (!org) throw new NotFoundException('Organization not found');

    const deleted = await this.orgRepo.removeMember(memberId);
    if (!deleted) throw new NotFoundException('Member not found');

    return { success: true };
  }
}
