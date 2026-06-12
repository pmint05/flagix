import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ProjectsRepository } from './projects.repository';
import { slugify } from '@/common/utils/slug';
import type { CreateProjectDto } from './dto/create-project.dto';
import type { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly projectRepo: ProjectsRepository) {}

  async create(orgId: string, dto: CreateProjectDto) {
    const slug = dto.slug ?? slugify(dto.name);

    const existing = await this.projectRepo.findByOrgAndSlug(orgId, slug);
    if (existing)
      throw new ConflictException(
        'Project slug already exists within organization',
      );

    return this.projectRepo.create({ ...dto, slug, organizationId: orgId });
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

  async update(orgId: string, projectId: string, dto: UpdateProjectDto) {
    const project = await this.projectRepo.findById(projectId);
    if (!project || project.organizationId !== orgId)
      throw new NotFoundException('Project not found');

    const updated = await this.projectRepo.update(projectId, dto);
    if (!updated) throw new NotFoundException('Project not found');
    return updated;
  }

  async remove(orgId: string, projectId: string) {
    const project = await this.projectRepo.findById(projectId);
    if (!project || project.organizationId !== orgId)
      throw new NotFoundException('Project not found');

    await this.projectRepo.softDelete(projectId);
    return { success: true };
  }
}
