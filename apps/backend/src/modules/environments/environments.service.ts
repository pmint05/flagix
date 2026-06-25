import {
  Injectable,
  NotFoundException,
  ConflictException,
  Optional,
} from '@nestjs/common';
import { EnvironmentsRepository } from './environments.repository';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { getActorId } from '@/common/audit/audit-context';
import { resolveEnvironmentAction } from '@/common/audit/resolve-action';
import { sanitizeEnvironment } from '@/common/audit/sanitize';
import { slugify } from '@/common/utils/slug';
import type { CreateEnvironmentDto } from './dto/create-environment.dto';
import type { UpdateEnvironmentDto } from './dto/update-environment.dto';

@Injectable()
export class EnvironmentsService {
  constructor(
    private readonly envRepo: EnvironmentsRepository,
    @Optional() private readonly auditLogsService?: AuditLogsService,
  ) {}

  async create(orgId: string, projectId: string, dto: CreateEnvironmentDto) {
    const slug = dto.slug ?? slugify(dto.name);

    const existing = await this.envRepo.findByProjectAndSlug(projectId, slug);
    if (existing)
      throw new ConflictException(
        'Environment slug already exists within project',
      );

    const actorId = getActorId();
    const env = await this.envRepo.create(
      { ...dto, slug, projectId, organizationId: orgId },
      actorId,
    );

    if (this.auditLogsService) {
      await this.auditLogsService.recordChange({
        organizationId: orgId,
        projectId: projectId,
        environmentId: env.id,
        entityType: 'environment',
        entityId: env.id,
        before: null,
        after: env,
        resolveAction: resolveEnvironmentAction,
        sanitize: sanitizeEnvironment,
      });
    }

    return env;
  }

  async findAllForProject(orgId: string, projectId: string) {
    return this.envRepo.findAllForProject(projectId);
  }

  async findOne(orgId: string, projectId: string, envId: string) {
    const env = await this.envRepo.findById(envId);
    if (!env || env.projectId !== projectId)
      throw new NotFoundException('Environment not found');
    return env;
  }

  async update(
    orgId: string,
    projectId: string,
    envId: string,
    dto: UpdateEnvironmentDto,
  ) {
    const env = await this.envRepo.findById(envId);
    if (!env || env.projectId !== projectId)
      throw new NotFoundException('Environment not found');

    const actorId = getActorId();
    const updated = await this.envRepo.update(envId, dto, actorId);
    if (!updated) throw new NotFoundException('Environment not found');

    if (this.auditLogsService) {
      await this.auditLogsService.recordChange({
        organizationId: orgId,
        projectId: projectId,
        environmentId: envId,
        entityType: 'environment',
        entityId: envId,
        before: env,
        after: updated,
        resolveAction: resolveEnvironmentAction,
        sanitize: sanitizeEnvironment,
      });
    }

    return updated;
  }

  async remove(orgId: string, projectId: string, envId: string) {
    const env = await this.envRepo.findById(envId);
    if (!env || env.projectId !== projectId)
      throw new NotFoundException('Environment not found');

    const actorId = getActorId();
    const deleted = await this.envRepo.softDelete(envId, actorId);

    if (this.auditLogsService) {
      await this.auditLogsService.recordChange({
        organizationId: orgId,
        projectId: projectId,
        environmentId: envId,
        entityType: 'environment',
        entityId: envId,
        before: env,
        after: deleted,
        resolveAction: resolveEnvironmentAction,
        sanitize: sanitizeEnvironment,
      });
    }

    return { success: true };
  }
}
