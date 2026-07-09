import { Inject, Injectable } from '@nestjs/common';
import { eq, and, isNull } from 'drizzle-orm';
import { organizations, organizationMembers, authUser, organizationInvitations } from '@/db/schema';
import { DATABASE } from '@/modules/database/database.module';
import { type Database } from '@/db';
import type {
  CreateOrganizationDto,
  UpdateOrganizationDto,
} from './dto/create-organization.dto';

@Injectable()
export class OrganizationsRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async findUserByEmail(email: string) {
    const [usr] = await this.db
      .select()
      .from(authUser)
      .where(eq(authUser.email, email))
      .limit(1);
    return usr ?? null;
  }

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

  async create(input: CreateOrganizationDto, actorId?: string) {
    const [org] = await this.db
      .insert(organizations)
      .values({
        name: input.name,
        slug: input.slug!,
        createdBy: actorId ?? null,
      })
      .returning();
    return org;
  }

  async update(id: string, input: UpdateOrganizationDto, actorId?: string) {
    const [org] = await this.db
      .update(organizations)
      .set({
        ...(input.name !== undefined && { name: input.name }),
        ...(input.slug !== undefined && { slug: input.slug }),
        updatedBy: actorId ?? null,
      })
      .where(eq(organizations.id, id))
      .returning();
    return org ?? null;
  }

  async softDelete(id: string, actorId?: string) {
    const [org] = await this.db
      .update(organizations)
      .set({ deletedAt: new Date(), deletedBy: actorId ?? null })
      .where(eq(organizations.id, id))
      .returning();
    return org ?? null;
  }

  async addMember(
    orgId: string,
    userId: string,
    role: 'admin' | 'editor' | 'viewer' = 'admin',
  ) {
    const [member] = await this.db
      .insert(organizationMembers)
      .values({
        userId,
        organizationId: orgId,
        role,
      })
      .returning();
    return member;
  }

  async findMembership(orgId: string, userId: string) {
    const [membership] = await this.db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.userId, userId),
          eq(organizationMembers.organizationId, orgId),
          isNull(organizationMembers.deletedAt),
        ),
      )
      .limit(1);
    return membership ?? null;
  }

  async findMembershipById(memberId: string) {
    const [membership] = await this.db
      .select()
      .from(organizationMembers)
      .where(eq(organizationMembers.id, memberId))
      .limit(1);
    return membership ?? null;
  }

  async findUsers(orgId: string) {
    return this.db
      .select({
        id: organizationMembers.id,
        userId: organizationMembers.userId,
        role: organizationMembers.role,
        name: authUser.name,
        email: authUser.email,
        createdAt: organizationMembers.createdAt,
      })
      .from(organizationMembers)
      .innerJoin(authUser, eq(organizationMembers.userId, authUser.id))
      .where(
        and(
          eq(organizationMembers.organizationId, orgId),
          isNull(organizationMembers.deletedAt),
        ),
      );
  }

  async findInvitationById(id: string) {
    const [invitation] = await this.db
      .select()
      .from(organizationInvitations)
      .where(and(eq(organizationInvitations.id, id), isNull(organizationInvitations.deletedAt)))
      .limit(1);
    return invitation ?? null;
  }

  async findInvitationByOrgAndEmail(orgId: string, email: string) {
    const [invitation] = await this.db
      .select()
      .from(organizationInvitations)
      .where(
        and(
          eq(organizationInvitations.organizationId, orgId),
          eq(organizationInvitations.email, email),
          eq(organizationInvitations.status, 'pending'),
          isNull(organizationInvitations.deletedAt),
        ),
      )
      .limit(1);
    return invitation ?? null;
  }

  async createInvitation(
    orgId: string,
    invitedBy: string,
    email: string,
    role: 'admin' | 'editor' | 'viewer',
  ) {
    const [invitation] = await this.db
      .insert(organizationInvitations)
      .values({
        organizationId: orgId,
        invitedBy,
        email,
        role,
        status: 'pending',
      })
      .returning();
    return invitation;
  }

  async findPendingInvitationsByEmail(email: string) {
    return this.db
      .select({
        id: organizationInvitations.id,
        email: organizationInvitations.email,
        role: organizationInvitations.role,
        status: organizationInvitations.status,
        createdAt: organizationInvitations.createdAt,
        organization: {
          id: organizations.id,
          name: organizations.name,
          slug: organizations.slug,
        },
        sender: {
          id: authUser.id,
          name: authUser.name,
          email: authUser.email,
        },
      })
      .from(organizationInvitations)
      .innerJoin(organizations, eq(organizationInvitations.organizationId, organizations.id))
      .innerJoin(authUser, eq(organizationInvitations.invitedBy, authUser.id))
      .where(
        and(
          eq(organizationInvitations.email, email),
          eq(organizationInvitations.status, 'pending'),
          isNull(organizationInvitations.deletedAt),
        ),
      );
  }

  async findInvitationsByOrg(orgId: string) {
    return this.db
      .select({
        id: organizationInvitations.id,
        email: organizationInvitations.email,
        role: organizationInvitations.role,
        status: organizationInvitations.status,
        createdAt: organizationInvitations.createdAt,
        sender: {
          id: authUser.id,
          name: authUser.name,
          email: authUser.email,
        },
      })
      .from(organizationInvitations)
      .innerJoin(authUser, eq(organizationInvitations.invitedBy, authUser.id))
      .where(
        and(
          eq(organizationInvitations.organizationId, orgId),
          isNull(organizationInvitations.deletedAt),
        ),
      );
  }

  async updateInvitationStatus(id: string, status: 'pending' | 'accepted' | 'rejected' | 'cancelled') {
    const [invitation] = await this.db
      .update(organizationInvitations)
      .set({ status })
      .where(eq(organizationInvitations.id, id))
      .returning();
    return invitation ?? null;
  }

  async updateMemberRole(id: string, role: 'admin' | 'editor' | 'viewer') {
    const [member] = await this.db
      .update(organizationMembers)
      .set({ role })
      .where(eq(organizationMembers.id, id))
      .returning();
    return member ?? null;
  }

  async removeMember(id: string) {
    const [member] = await this.db
      .update(organizationMembers)
      .set({ deletedAt: new Date() })
      .where(eq(organizationMembers.id, id))
      .returning();
    return member ?? null;
  }
}
