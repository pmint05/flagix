import { Inject, Injectable } from '@nestjs/common';
import { tags } from '@/db/schema';
import { eq, and, ilike } from 'drizzle-orm';
import { DATABASE } from '@/modules/database/database.module';
import { type Database } from '@/db';

@Injectable()
export class TagsRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async findById(id: string) {
    const [tag] = await this.db
      .select()
      .from(tags)
      .where(eq(tags.id, id))
      .limit(1);
    return tag ?? null;
  }

  async findAllForProject(projectId: string) {
    return this.db
      .select()
      .from(tags)
      .where(eq(tags.projectId, projectId));
  }

  async findByNameAndProject(projectId: string, name: string) {
    const [tag] = await this.db
      .select()
      .from(tags)
      .where(
        and(
          eq(tags.projectId, projectId),
          eq(tags.name, name),
        ),
      )
      .limit(1);
    return tag ?? null;
  }

  async searchInProject(projectId: string, q: string) {
    return this.db
      .select()
      .from(tags)
      .where(
        and(
          eq(tags.projectId, projectId),
          ilike(tags.name, `%${q}%`),
        ),
      )
      .limit(15);
  }

  async create(input: { projectId: string; organizationId: string; name: string }) {
    const [tag] = await this.db
      .insert(tags)
      .values({
        projectId: input.projectId,
        organizationId: input.organizationId,
        name: input.name,
      })
      .returning();
    return tag;
  }

  async delete(id: string) {
    await this.db.delete(tags).where(eq(tags.id, id));
  }
}
