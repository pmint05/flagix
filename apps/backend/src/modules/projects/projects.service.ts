import {
  Injectable,
  NotFoundException,
  ConflictException,
  Optional,
} from '@nestjs/common';
import { ProjectsRepository } from './projects.repository';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { getActorId } from '@/common/audit/audit-context';
import { resolveProjectAction } from '@/common/audit/resolve-action';
import { sanitizeProject } from '@/common/audit/sanitize';
import { slugify } from '@/common/utils/slug';
import type { CreateProjectDto } from './dto/create-project.dto';
import type { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly projectRepo: ProjectsRepository,
    @Optional() private readonly auditLogsService?: AuditLogsService,
  ) {}

  async create(orgId: string, dto: CreateProjectDto) {
    const slug = dto.slug ?? slugify(dto.name);

    const existing = await this.projectRepo.findByOrgAndSlug(orgId, slug);
    if (existing)
      throw new ConflictException(
        'Project slug already exists within organization',
      );

    const actorId = getActorId();
    const project = await this.projectRepo.create(
      { ...dto, slug, organizationId: orgId },
      actorId,
    );

    if (this.auditLogsService) {
      await this.auditLogsService.recordChange({
        organizationId: orgId,
        projectId: project.id,
        entityType: 'project',
        entityId: project.id,
        before: null,
        after: project,
        resolveAction: resolveProjectAction,
        sanitize: sanitizeProject,
      });
    }

    return project;
  }

  async findAll(orgId: string) {
    return this.projectRepo.findAllForOrg(orgId);
  }

  async findOne(orgId: string, projectId: string) {
    const project = await this.projectRepo.findById(projectId);
    if (!project || project.organizationId !== orgId)
      throw new NotFoundException('Project not found');
    return project;
  }

  async findBySlug(orgId: string, slug: string) {
    const project = await this.projectRepo.findByOrgAndSlug(orgId, slug);
    if (!project || project.organizationId !== orgId)
      throw new NotFoundException('Project not found');
    return project;
  }

  async update(orgId: string, projectId: string, dto: UpdateProjectDto) {
    const project = await this.projectRepo.findById(projectId);
    if (!project || project.organizationId !== orgId)
      throw new NotFoundException('Project not found');

    const actorId = getActorId();
    const updated = await this.projectRepo.update(projectId, dto, actorId);
    if (!updated) throw new NotFoundException('Project not found');

    if (this.auditLogsService) {
      await this.auditLogsService.recordChange({
        organizationId: orgId,
        projectId: projectId,
        entityType: 'project',
        entityId: projectId,
        before: project,
        after: updated,
        resolveAction: resolveProjectAction,
        sanitize: sanitizeProject,
      });
    }

    return updated;
  }

  async remove(orgId: string, projectId: string) {
    const project = await this.projectRepo.findById(projectId);
    if (!project || project.organizationId !== orgId)
      throw new NotFoundException('Project not found');

    const actorId = getActorId();
    const deleted = await this.projectRepo.softDelete(projectId, actorId);

    if (this.auditLogsService) {
      await this.auditLogsService.recordChange({
        organizationId: orgId,
        projectId: projectId,
        entityType: 'project',
        entityId: projectId,
        before: project,
        after: deleted,
        resolveAction: resolveProjectAction,
        sanitize: sanitizeProject,
      });
    }

    return { success: true };
  }
}
