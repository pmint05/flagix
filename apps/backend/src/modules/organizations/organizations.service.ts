import {
  Inject,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { eq, and, isNull } from 'drizzle-orm';
import { organizationMembers } from '@/db/schema';
import { DATABASE } from '@/modules/database/database.module';
import { type Database } from '@/db';
import { OrganizationsRepository } from './organizations.repository';
import { slugify } from '@/common/utils/slug';
import type {
  CreateOrganizationDto,
  UpdateOrganizationDto,
} from './dto/create-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly orgRepo: OrganizationsRepository,
    @Inject(DATABASE) private readonly db: Database,
  ) {}

  async create(input: CreateOrganizationDto, actorId: string) {
    const slug = input.slug ?? slugify(input.name);

    const existing = await this.orgRepo.findBySlug(slug);
    if (existing) {
      throw new ConflictException('Organization slug already exists');
    }

    const org = await this.orgRepo.create({ ...input, slug });

    await this.db.insert(organizationMembers).values({
      userId: actorId,
      organizationId: org.id,
      role: 'admin',
    });

    return org;
  }

  async findOneForUser(id: string, userId: string) {
    const org = await this.orgRepo.findById(id);
    if (!org) throw new NotFoundException('Organization not found');

    const [membership] = await this.db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.userId, userId),
          eq(organizationMembers.organizationId, id),
          isNull(organizationMembers.deletedAt),
        ),
      )
      .limit(1);

    if (!membership) throw new NotFoundException('Organization not found');

    return { ...org, role: membership.role };
  }

  async findAllForUser(userId: string) {
    return this.orgRepo.findAllForUser(userId);
  }

  async update(id: string, input: UpdateOrganizationDto) {
    const org = await this.orgRepo.findById(id);
    if (!org) throw new NotFoundException('Organization not found');

    if (input.slug) {
      const existing = await this.orgRepo.findBySlug(input.slug);
      if (existing && existing.id !== id) {
        throw new ConflictException('Organization slug already exists');
      }
    }

    const updated = await this.orgRepo.update(id, input);
    if (!updated) throw new NotFoundException('Organization not found');
    return updated;
  }

  async remove(id: string) {
    const org = await this.orgRepo.findById(id);
    if (!org) throw new NotFoundException('Organization not found');

    await this.orgRepo.softDelete(id);
    return { success: true };
  }
}
