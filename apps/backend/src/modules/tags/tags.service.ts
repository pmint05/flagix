import {
  Injectable,
  ConflictException,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { TagsRepository } from './tags.repository';
import { CreateTagDto } from './dto/create-tag.dto';
import { AuditLogsService } from '@/modules/audit-logs/audit-logs.service';
import { resolveTagAction } from '@/common/audit/resolve-action';
import { sanitizeTag } from '@/common/audit/sanitize';

@Injectable()
export class TagsService {
  constructor(
    private readonly tagsRepo: TagsRepository,
    @Optional() private readonly auditLogsService?: AuditLogsService,
  ) {}

  async create(orgId: string, projectId: string, dto: CreateTagDto) {
    const existing = await this.tagsRepo.findByNameAndProject(projectId, dto.name);
    if (existing) {
      throw new ConflictException('Tag name already exists in this project');
    }
    const tag = await this.tagsRepo.create({
      projectId,
      organizationId: orgId,
      name: dto.name,
    });

    if (this.auditLogsService) {
      await this.auditLogsService.recordChange({
        organizationId: orgId,
        projectId,
        entityType: 'tag',
        entityId: tag.id,
        before: null,
        after: tag,
        resolveAction: resolveTagAction,
        sanitize: sanitizeTag,
      });
    }

    return tag;
  }

  async findAllForProject(projectId: string) {
    return this.tagsRepo.findAllForProject(projectId);
  }

  async searchInProject(projectId: string, q: string) {
    return this.tagsRepo.searchInProject(projectId, q);
  }

  async remove(tagId: string) {
    const tag = await this.tagsRepo.findById(tagId);
    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    if (this.auditLogsService) {
      await this.auditLogsService.recordChange({
        organizationId: tag.organizationId,
        projectId: tag.projectId,
        entityType: 'tag',
        entityId: tagId,
        before: tag,
        after: null,
        resolveAction: resolveTagAction,
        sanitize: sanitizeTag,
      });
    }

    await this.tagsRepo.delete(tagId);
    return { success: true };
  }
}
