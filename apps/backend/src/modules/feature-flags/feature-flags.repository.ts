import { Inject, Injectable } from '@nestjs/common';
import { eq, and, isNull } from 'drizzle-orm';
import { featureFlags, variations, environments } from '@/db/schema';
import { DATABASE } from '@/modules/database/database.module';
import { type Database } from '@/db';
import type {
  CreateFeatureFlagDto,
  UpdateFeatureFlagDto,
} from './dto/create-feature-flag.dto';

@Injectable()
export class FeatureFlagsRepository {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
  ) {}

  async findById(id: string) {
    const [flag] = await this.db
      .select()
      .from(featureFlags)
      .where(and(eq(featureFlags.id, id), isNull(featureFlags.deletedAt)))
      .limit(1);
    return flag ?? null;
  }

  async findByIdWithProject(id: string) {
    const [result] = await this.db
      .select({
        flag: featureFlags,
        projectId: environments.projectId,
      })
      .from(featureFlags)
      .innerJoin(environments, eq(featureFlags.environmentId, environments.id))
      .where(and(eq(featureFlags.id, id), isNull(featureFlags.deletedAt)))
      .limit(1);
    return result ?? null;
  }

  async findByKey(envId: string, key: string) {
    const [flag] = await this.db
      .select()
      .from(featureFlags)
      .where(
        and(
          eq(featureFlags.environmentId, envId),
          eq(featureFlags.key, key),
          isNull(featureFlags.deletedAt),
        ),
      )
      .limit(1);
    return flag ?? null;
  }

  async findAllForEnv(envId: string, statusFilter?: string) {
    const conditions = [
      eq(featureFlags.environmentId, envId),
      isNull(featureFlags.deletedAt),
    ];

    if (statusFilter) {
      conditions.push(
        eq(
          featureFlags.status,
          statusFilter as 'draft' | 'active' | 'archived',
        ),
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

  async createWithVariations(
    input: CreateFeatureFlagDto & {
      organizationId: string;
      environmentId: string;
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
          environmentId: input.environmentId,
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
          and(eq(variations.featureFlagId, flag.id), isNull(variations.deletedAt)),
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
        ...(input.isEnabled !== undefined && { isEnabled: input.isEnabled }),
        ...(input.status !== undefined && { status: input.status }),
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
