import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { EnvironmentsRepository } from './environments.repository';
import { slugify } from '@/common/utils/slug';
import type { CreateEnvironmentDto } from './dto/create-environment.dto';
import type { UpdateEnvironmentDto } from './dto/update-environment.dto';

@Injectable()
export class EnvironmentsService {
  constructor(private readonly envRepo: EnvironmentsRepository) {}

  async create(orgId: string, projectId: string, dto: CreateEnvironmentDto) {
    const slug = dto.slug ?? slugify(dto.name);

    const existing = await this.envRepo.findByProjectAndSlug(projectId, slug);
    if (existing)
      throw new ConflictException(
        'Environment slug already exists within project',
      );

    return this.envRepo.create({ ...dto, slug, projectId });
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

    const updated = await this.envRepo.update(envId, dto);
    if (!updated) throw new NotFoundException('Environment not found');
    return updated;
  }

  async remove(orgId: string, projectId: string, envId: string) {
    const env = await this.envRepo.findById(envId);
    if (!env || env.projectId !== projectId)
      throw new NotFoundException('Environment not found');

    await this.envRepo.softDelete(envId);
    return { success: true };
  }
}
