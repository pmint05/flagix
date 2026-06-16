import {
  Injectable,
  NotFoundException,
  ConflictException,
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

    return org;
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

    return updated;
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
}
