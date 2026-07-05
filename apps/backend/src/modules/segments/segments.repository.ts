import { Inject, Injectable } from '@nestjs/common';
import { segments } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { DATABASE } from '@/modules/database/database.module';
import { type Database } from '@/db';
import type { CreateSegmentDto } from './dto/create-segment.dto';
import type { UpdateSegmentDto } from './dto/update-segment.dto';

@Injectable()
export class SegmentsRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async findById(id: string) {
    const [segment] = await this.db
      .select()
      .from(segments)
      .where(and(eq(segments.id, id), isNull(segments.deletedAt)))
      .limit(1);
    return segment ?? null;
  }

  async findAllForProject(projectId: string) {
    return this.db
      .select()
      .from(segments)
      .where(
        and(
          eq(segments.projectId, projectId),
          isNull(segments.deletedAt),
        ),
      );
  }

  async findByProjectAndKey(projectId: string, key: string) {
    const [segment] = await this.db
      .select()
      .from(segments)
      .where(
        and(
          eq(segments.projectId, projectId),
          eq(segments.key, key),
          isNull(segments.deletedAt),
        ),
      )
      .limit(1);
    return segment ?? null;
  }

  async findBySlug(projectId: string, slug: string) {
    return this.findByProjectAndKey(projectId, slug);
  }

  async create(
    input: CreateSegmentDto & { projectId: string; organizationId: string },
    actorId?: string,
  ) {
    const [segment] = await this.db
      .insert(segments)
      .values({
        organizationId: input.organizationId,
        projectId: input.projectId,
        name: input.name,
        key: input.key,
        description: input.description ?? null,
        conditions: input.conditions,
        createdBy: actorId ?? null,
      })
      .returning();
    return segment;
  }

  async update(id: string, input: UpdateSegmentDto, actorId?: string) {
    const [segment] = await this.db
      .update(segments)
      .set({
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.conditions !== undefined && { conditions: input.conditions }),
        updatedBy: actorId ?? null,
        updatedAt: new Date(),
      })
      .where(eq(segments.id, id))
      .returning();
    return segment ?? null;
  }

  async softDelete(id: string, actorId?: string) {
    const [segment] = await this.db
      .update(segments)
      .set({
        deletedAt: new Date(),
        updatedBy: actorId ?? null,
      })
      .where(eq(segments.id, id))
      .returning();
    return segment ?? null;
  }
}
