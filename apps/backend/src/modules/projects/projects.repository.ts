import { Inject, Injectable } from '@nestjs/common';
import { eq, and, isNull } from 'drizzle-orm';
import { projects } from '@/db/schema';
import { DATABASE } from '@/modules/database/database.module';
import { type Database } from '@/db';
import type { CreateProjectDto } from './dto/create-project.dto';
import type { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async findById(id: string) {
    const [project] = await this.db
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), isNull(projects.deletedAt)))
      .limit(1);
    return project ?? null;
  }

  async findAllForOrg(orgId: string) {
    return this.db
      .select()
      .from(projects)
      .where(
        and(eq(projects.organizationId, orgId), isNull(projects.deletedAt)),
      );
  }

  async findByOrgAndSlug(orgId: string, slug: string) {
    const [project] = await this.db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.organizationId, orgId),
          eq(projects.slug, slug),
          isNull(projects.deletedAt),
        ),
      )
      .limit(1);
    return project ?? null;
  }

  async create(
    input: CreateProjectDto & { organizationId: string },
    actorId?: string,
  ) {
    const [project] = await this.db
      .insert(projects)
      .values({
        organizationId: input.organizationId,
        name: input.name,
        slug: input.slug!,
        description: input.description ?? null,
        createdBy: actorId ?? null,
      })
      .returning();
    return project;
  }

  async update(id: string, input: UpdateProjectDto, actorId?: string) {
    const [project] = await this.db
      .update(projects)
      .set({
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && {
          description: input.description,
        }),
        updatedBy: actorId ?? null,
      })
      .where(eq(projects.id, id))
      .returning();
    return project ?? null;
  }

  async softDelete(id: string, actorId?: string) {
    const [project] = await this.db
      .update(projects)
      .set({ deletedAt: new Date(), deletedBy: actorId ?? null })
      .where(eq(projects.id, id))
      .returning();
    return project ?? null;
  }
}
