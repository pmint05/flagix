import { Inject, Injectable } from '@nestjs/common';
import { eq, and, isNull } from 'drizzle-orm';
import { organizations, organizationMembers } from '@/db/schema';
import { DATABASE } from '@/modules/database/database.module';
import { type Database } from '@/db';
import type {
  CreateOrganizationDto,
  UpdateOrganizationDto,
} from './dto/create-organization.dto';

@Injectable()
export class OrganizationsRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async findById(id: string) {
    const [org] = await this.db
      .select()
      .from(organizations)
      .where(and(eq(organizations.id, id), isNull(organizations.deletedAt)))
      .limit(1);
    return org ?? null;
  }

  async findBySlug(slug: string) {
    const [org] = await this.db
      .select()
      .from(organizations)
      .where(and(eq(organizations.slug, slug), isNull(organizations.deletedAt)))
      .limit(1);
    return org ?? null;
  }

  async findAllForUser(userId: string) {
    return this.db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        role: organizationMembers.role,
        createdAt: organizations.createdAt,
        updatedAt: organizations.updatedAt,
      })
      .from(organizations)
      .innerJoin(
        organizationMembers,
        eq(organizations.id, organizationMembers.organizationId),
      )
      .where(
        and(
          eq(organizationMembers.userId, userId),
          isNull(organizationMembers.deletedAt),
          isNull(organizations.deletedAt),
        ),
      );
  }

  async create(input: CreateOrganizationDto) {
    const [org] = await this.db
      .insert(organizations)
      .values({
        name: input.name,
        slug: input.slug!,
      })
      .returning();
    return org;
  }

  async update(id: string, input: UpdateOrganizationDto) {
    const [org] = await this.db
      .update(organizations)
      .set({
        ...(input.name !== undefined && { name: input.name }),
        ...(input.slug !== undefined && { slug: input.slug }),
      })
      .where(eq(organizations.id, id))
      .returning();
    return org ?? null;
  }

  async softDelete(id: string) {
    const [org] = await this.db
      .update(organizations)
      .set({ deletedAt: new Date() })
      .where(eq(organizations.id, id))
      .returning();
    return org ?? null;
  }
}
