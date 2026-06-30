import { Inject, Injectable } from '@nestjs/common';
import { eq, and, isNull, inArray } from 'drizzle-orm';
import { projects, environments, featureFlags, variations, targetingRules, sdkKeys, flagStates } from '@/db/schema';
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
		return this.db.transaction(async (tx) => {
			const deletedAt = new Date();

			// 1. Soft-delete project
			const [project] = await tx
				.update(projects)
				.set({ deletedAt, deletedBy: actorId ?? null })
				.where(eq(projects.id, id))
				.returning();

			if (!project) return null;

			// 2. Fetch related environment and feature flag IDs
			const envs = await tx
				.select({ id: environments.id })
				.from(environments)
				.where(eq(environments.projectId, id));
			const envIds = envs.map((e) => e.id);

			const flags = await tx
				.select({ id: featureFlags.id })
				.from(featureFlags)
				.where(eq(featureFlags.projectId, id));
			const flagIds = flags.map((f) => f.id);

			// 3. Soft-delete environments
			await tx
				.update(environments)
				.set({ deletedAt, deletedBy: actorId ?? null })
				.where(eq(environments.projectId, id));

			// 4. Soft-delete feature flags
			await tx
				.update(featureFlags)
				.set({ deletedAt, deletedBy: actorId ?? null })
				.where(eq(featureFlags.projectId, id));

			// 5. Cascade soft-delete sdk keys under those environments
			if (envIds.length > 0) {
				await tx
					.update(sdkKeys)
					.set({ deletedAt, deletedBy: actorId ?? null })
					.where(inArray(sdkKeys.environmentId, envIds));

				await tx
					.update(flagStates)
					.set({ deletedAt })
					.where(inArray(flagStates.environmentId, envIds));

				await tx
					.update(targetingRules)
					.set({ deletedAt })
					.where(inArray(targetingRules.environmentId, envIds));
			}

			// 6. Cascade soft-delete states, rules, and variations under those flags
			if (flagIds.length > 0) {
				await tx
					.update(flagStates)
					.set({ deletedAt })
					.where(inArray(flagStates.featureFlagId, flagIds));

				await tx
					.update(targetingRules)
					.set({ deletedAt })
					.where(inArray(targetingRules.featureFlagId, flagIds));

				await tx
					.update(variations)
					.set({ deletedAt })
					.where(inArray(variations.featureFlagId, flagIds));
			}

			return project;
		});
	}
}
