import { Inject, Injectable } from '@nestjs/common';
import { eq, and, isNull } from 'drizzle-orm';
import { environments } from '@/db/schema';
import { DATABASE } from '@/modules/database/database.module';
import { type Database } from '@/db';
import type { CreateEnvironmentDto } from './dto/create-environment.dto';
import type { UpdateEnvironmentDto } from './dto/update-environment.dto';

@Injectable()
export class EnvironmentsRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async findById(id: string) {
    const [env] = await this.db
      .select()
      .from(environments)
      .where(and(eq(environments.id, id), isNull(environments.deletedAt)))
      .limit(1);
    return env ?? null;
  }

  async findAllForProject(projectId: string) {
    return this.db
      .select()
      .from(environments)
      .where(
        and(
          eq(environments.projectId, projectId),
          isNull(environments.deletedAt),
        ),
      );
  }

  async findByProjectAndSlug(projectId: string, slug: string) {
    const [env] = await this.db
      .select()
      .from(environments)
      .where(
        and(
          eq(environments.projectId, projectId),
          eq(environments.slug, slug),
          isNull(environments.deletedAt),
        ),
      )
      .limit(1);
    return env ?? null;
  }

  async create(input: CreateEnvironmentDto & { projectId: string }, actorId?: string) {
    const [env] = await this.db
      .insert(environments)
      .values({
        projectId: input.projectId,
        name: input.name,
        slug: input.slug!,
        description: input.description ?? null,
        createdBy: actorId ?? null,
      })
      .returning();
    return env;
  }

  async update(id: string, input: UpdateEnvironmentDto, actorId?: string) {
    const [env] = await this.db
      .update(environments)
      .set({
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && {
          description: input.description,
        }),
        updatedBy: actorId ?? null,
      })
      .where(eq(environments.id, id))
      .returning();
    return env ?? null;
  }

  async softDelete(id: string, actorId?: string) {
    const [env] = await this.db
      .update(environments)
      .set({ deletedAt: new Date(), deletedBy: actorId ?? null })
      .where(eq(environments.id, id))
      .returning();
    return env ?? null;
  }
}
