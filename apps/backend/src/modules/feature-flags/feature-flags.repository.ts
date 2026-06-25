import { Inject, Injectable } from '@nestjs/common';
import { eq, and, isNull, count } from 'drizzle-orm';
import { featureFlags, flagStates, variations } from '@/db/schema';
import { DATABASE } from '@/modules/database/database.module';
import { type Database } from '@/db';
import type {
  CreateFeatureFlagDto,
  UpdateFeatureFlagDto,
} from './dto/create-feature-flag.dto';

@Injectable()
export class FeatureFlagsRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async findById(id: string) {
    const [flag] = await this.db
      .select()
      .from(featureFlags)
      .where(and(eq(featureFlags.id, id), isNull(featureFlags.deletedAt)))
      .limit(1);
    return flag ?? null;
  }

  async findByIdWithProject(id: string) {
    const [flag] = await this.db
      .select()
      .from(featureFlags)
      .where(and(eq(featureFlags.id, id), isNull(featureFlags.deletedAt)))
      .limit(1);
    return flag ?? null;
  }

  async findByKey(projectId: string, key: string) {
    const [flag] = await this.db
      .select()
      .from(featureFlags)
      .where(
        and(
          eq(featureFlags.projectId, projectId),
          eq(featureFlags.key, key),
          isNull(featureFlags.deletedAt),
        ),
      )
      .limit(1);
    return flag ?? null;
  }

  async findAllForProject(projectId: string, statusFilter?: string) {
    const conditions = [
      eq(featureFlags.projectId, projectId),
      isNull(featureFlags.deletedAt),
    ];

    if (statusFilter) {
      conditions.push(
        eq(featureFlags.flagType, statusFilter as 'boolean' | 'multivariate'),
      );
    }

    return this.db
      .select()
      .from(featureFlags)
      .where(and(...conditions));
  }

  async findVariationsForFlag(flagId: string) {
    return this.db
      .select()
      .from(variations)
      .where(
        and(eq(variations.featureFlagId, flagId), isNull(variations.deletedAt)),
      );
  }

  async findAllForEnv(envId: string, statusFilter?: string) {
    const conditions = [
      eq(flagStates.environmentId, envId),
      isNull(flagStates.deletedAt),
    ];

    if (statusFilter) {
      conditions.push(eq(flagStates.status, statusFilter));
    }

    const states = await this.db
      .select({
        flag: featureFlags,
        state: flagStates,
      })
      .from(flagStates)
      .innerJoin(featureFlags, eq(flagStates.featureFlagId, featureFlags.id))
      .where(and(...conditions));

    return states.map(({ flag, state }) => ({
      ...flag,
      isEnabled: state.isEnabled,
      status: state.status,
      environmentId: state.environmentId,
      stateId: state.id,
      stateVersion: state.version,
    }));
  }

  async findFlagState(flagId: string, envId: string) {
    const [state] = await this.db
      .select()
      .from(flagStates)
      .where(
        and(
          eq(flagStates.featureFlagId, flagId),
          eq(flagStates.environmentId, envId),
        ),
      )
      .limit(1);
    return state ?? null;
  }

  async findFlagStatesForFlag(flagId: string) {
    return this.db
      .select()
      .from(flagStates)
      .where(
        and(eq(flagStates.featureFlagId, flagId), isNull(flagStates.deletedAt)),
      );
  }

  async upsertFlagState(input: {
    organizationId: string;
    featureFlagId: string;
    environmentId: string;
    isEnabled: boolean;
    status: string;
  }) {
    const [state] = await this.db
      .insert(flagStates)
      .values(input)
      .onConflictDoUpdate({
        target: [flagStates.featureFlagId, flagStates.environmentId],
        set: { isEnabled: input.isEnabled, status: input.status },
      })
      .returning();
    return state;
  }

  async createWithVariations(
    input: CreateFeatureFlagDto & {
      organizationId: string;
      projectId: string;
    },
    variationData: Array<{
      key: string;
      value: unknown;
      description?: string;
      isDefault: boolean;
    }>,
    actorId?: string,
  ) {
    return this.db.transaction(async (tx) => {
      const [flag] = await tx
        .insert(featureFlags)
        .values({
          organizationId: input.organizationId,
          projectId: input.projectId,
          key: input.key,
          name: input.name,
          description: input.description ?? null,
          flagType: input.flagType,
          createdBy: actorId ?? null,
        })
        .returning();

      if (variationData.length > 0) {
        await tx.insert(variations).values(
          variationData.map((v) => ({
            organizationId: input.organizationId,
            featureFlagId: flag.id,
            key: v.key,
            value: v.value,
            description: v.description ?? null,
            isDefault: v.isDefault,
          })),
        );
      }

      const createdVariations = await tx
        .select()
        .from(variations)
        .where(
          and(
            eq(variations.featureFlagId, flag.id),
            isNull(variations.deletedAt),
          ),
        );

      return { flag, variations: createdVariations };
    });
  }

  async update(
    id: string,
    input: UpdateFeatureFlagDto,
    currentVersion: number,
    actorId?: string,
  ) {
    const [flag] = await this.db
      .update(featureFlags)
      .set({
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && {
          description: input.description,
        }),
        version: currentVersion + 1,
        updatedBy: actorId ?? null,
      })
      .where(
        and(eq(featureFlags.id, id), eq(featureFlags.version, currentVersion)),
      )
      .returning();
    return flag ?? null;
  }

  async softDelete(id: string, actorId?: string) {
    const [flag] = await this.db
      .update(featureFlags)
      .set({ deletedAt: new Date(), deletedBy: actorId ?? null })
      .where(eq(featureFlags.id, id))
      .returning();
    return flag ?? null;
  }
}
