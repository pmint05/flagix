import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { TagsRepository } from './tags.repository';
import { CreateTagDto } from './dto/create-tag.dto';

@Injectable()
export class TagsService {
  constructor(private readonly tagsRepo: TagsRepository) {}

  async create(orgId: string, projectId: string, dto: CreateTagDto) {
    const existing = await this.tagsRepo.findByNameAndProject(projectId, dto.name);
    if (existing) {
      throw new ConflictException('Tag name already exists in this project');
    }
    return this.tagsRepo.create({
      projectId,
      organizationId: orgId,
      name: dto.name,
    });
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
    await this.tagsRepo.delete(tagId);
    return { success: true };
  }
}
