import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, and, isNull, count } from 'drizzle-orm';
import { featureFlags, flagStates, variations, targetingRules } from '@/db/schema';
import { DATABASE } from '@/modules/database/database.module';
import { type Database } from '@/db';
import type {
  CreateFeatureFlagDto,
  UpdateFeatureFlagDto,
  PatchFeatureFlagConfigDto,
} from './dto/feature-flag.dto';
import * as crypto from 'crypto';

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

  async findFlagStatesForFlag(flagId: string, envId?: string) {
    const conditions = [
      eq(flagStates.featureFlagId, flagId),
      isNull(flagStates.deletedAt),
    ];
    if (envId) {
      conditions.push(eq(flagStates.environmentId, envId));
    }
    return this.db
      .select()
      .from(flagStates)
      .where(and(...conditions));
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

  async patchConfig(
    flagId: string,
    envId: string,
    orgId: string,
    payload: PatchFeatureFlagConfigDto,
    actorId?: string,
  ) {
    return this.db.transaction(async (tx) => {
      // 1. Fetch current flag, variations, rules, and flag state
      const [flag] = await tx
        .select()
        .from(featureFlags)
        .where(and(eq(featureFlags.id, flagId), isNull(featureFlags.deletedAt)))
        .limit(1);

      if (!flag) {
        throw new NotFoundException('Feature flag not found');
      }

      // Fetch variations
      const currentVariations = await tx
        .select()
        .from(variations)
        .where(and(eq(variations.featureFlagId, flagId), isNull(variations.deletedAt)));

      // Fetch rules for this environment
      const currentRules = await tx
        .select()
        .from(targetingRules)
        .where(
          and(
            eq(targetingRules.featureFlagId, flagId),
            eq(targetingRules.environmentId, envId),
            isNull(targetingRules.deletedAt),
          ),
        );

      // Fetch flag state for this environment
      const [currentFlagState] = await tx
        .select()
        .from(flagStates)
        .where(
          and(
            eq(flagStates.featureFlagId, flagId),
            eq(flagStates.environmentId, envId),
          ),
        )
        .limit(1);

      // 2. Simulate & Merge the Target State
      let targetVariations = currentVariations;
      let variationsUpdated = false;
      if (payload.variations !== undefined) {
        variationsUpdated = true;
        targetVariations = payload.variations.map((pv) => {
          const id = pv.id || currentVariations.find((cv) => cv.key === pv.key)?.id || crypto.randomUUID();
          return {
            id,
            organizationId: orgId,
            featureFlagId: flagId,
            key: pv.key,
            value: pv.value,
            description: pv.description ?? null,
            isDefault: pv.isDefault ?? false,
          } as any;
        });
      }

      let targetRules = currentRules;
      let rulesUpdated = false;
      if (payload.rules !== undefined) {
        rulesUpdated = true;
        targetRules = payload.rules.map((pr, idx) => {
          return {
            id: pr.id || crypto.randomUUID(),
            organizationId: orgId,
            featureFlagId: flagId,
            environmentId: envId,
            ruleType: pr.ruleType,
            priority: String(idx),
            variationId: pr.variationId || null,
            conditions: pr.conditions,
            isEnabled: pr.isEnabled ?? true,
          } as any;
        });
      }

      const nextDefaultId = payload.defaultVariationId || (variationsUpdated ? targetVariations.find((v) => v.isDefault)?.id : null);

      // 3. Cross-validate Target State
      const validVariationIds = new Set(targetVariations.map((v) => v.id));

      const finalDefaultId = nextDefaultId || currentFlagState?.defaultVariationId;
      if (finalDefaultId && !validVariationIds.has(finalDefaultId)) {
        throw new BadRequestException('Default variation does not exist in target variations');
      }

      const finalOffId = payload.offVariationId !== undefined ? payload.offVariationId : currentFlagState?.offVariationId;
      if (finalOffId && !validVariationIds.has(finalOffId)) {
        throw new BadRequestException('Off variation does not exist in target variations');
      }

      for (const rule of targetRules) {
        if (rule.ruleType !== 'percentage') {
          if (!rule.variationId) {
            throw new BadRequestException(`Rule of type ${rule.ruleType} must specify a variationId`);
          }
          if (!validVariationIds.has(rule.variationId)) {
            throw new BadRequestException(`Rule references non-existent variation: ${rule.variationId}`);
          }
        } else {
          const rollouts = (rule.conditions as any)?.rollouts as Array<{ variationId: string, percentage: number }> | undefined;
          if (rollouts && Array.isArray(rollouts)) {
            for (const r of rollouts) {
              if (!validVariationIds.has(r.variationId)) {
                throw new BadRequestException(`Percentage rollout references non-existent variation: ${r.variationId}`);
              }
            }
          }
        }
      }

      // 4. Execute updates in transaction with safe dependency order
      // A. Variations updates (insert / update)
      if (variationsUpdated) {
        const currentIds = new Set(currentVariations.map((cv) => cv.id));
        for (const tv of targetVariations) {
          if (currentIds.has(tv.id)) {
            await tx
              .update(variations)
              .set({
                key: tv.key,
                value: tv.value,
                description: tv.description,
                isDefault: tv.isDefault,
                updatedAt: new Date(),
              })
              .where(eq(variations.id, tv.id));
          } else {
            await tx.insert(variations).values({
              id: tv.id,
              organizationId: tv.organizationId,
              featureFlagId: tv.featureFlagId,
              key: tv.key,
              value: tv.value,
              description: tv.description,
              isDefault: tv.isDefault,
            });
          }
        }
      }

      // B. Overwrite Targeting Rules for this environment
      if (rulesUpdated) {
        await tx
          .delete(targetingRules)
          .where(
            and(
              eq(targetingRules.featureFlagId, flagId),
              eq(targetingRules.environmentId, envId),
            ),
          );

        if (targetRules.length > 0) {
          await tx.insert(targetingRules).values(
            targetRules.map((tr) => ({
              id: tr.id,
              organizationId: tr.organizationId,
              featureFlagId: tr.featureFlagId,
              environmentId: tr.environmentId,
              ruleType: tr.ruleType,
              priority: tr.priority,
              variationId: tr.variationId,
              conditions: tr.conditions,
              isEnabled: tr.isEnabled,
              createdBy: actorId ?? null,
            })),
          );
        }
      }

      // C. Delete omitted variations
      if (variationsUpdated) {
        const targetIds = new Set(targetVariations.map((tv) => tv.id));
        const toDeleteIds = currentVariations
          .filter((cv) => !targetIds.has(cv.id))
          .map((cv) => cv.id);

        if (toDeleteIds.length > 0) {
          for (const dId of toDeleteIds) {
            await tx
              .update(variations)
              .set({ deletedAt: new Date() })
              .where(eq(variations.id, dId));
          }
        }
      }

      // D. Update variation default flags
      if (nextDefaultId) {
        await tx
          .update(variations)
          .set({ isDefault: false })
          .where(eq(variations.featureFlagId, flagId));

        await tx
          .update(variations)
          .set({ isDefault: true })
          .where(eq(variations.id, nextDefaultId));
      }

      // E. Update flag states (isEnabled, status, defaultVariationId, offVariationId)
      if (currentFlagState) {
        const nextEnabled = payload.isEnabled !== undefined ? payload.isEnabled : currentFlagState.isEnabled;
        const nextStatus = payload.status !== undefined ? payload.status : currentFlagState.status;

        await tx
          .update(flagStates)
          .set({
            isEnabled: nextEnabled,
            status: nextStatus,
            offVariationId: finalOffId || null,
            defaultVariationId: finalDefaultId || null,
            version: currentFlagState.version + 1,
            updatedBy: actorId ?? null,
            updatedAt: new Date(),
          })
          .where(eq(flagStates.id, currentFlagState.id));
      }

      // F. Update flag attributes (name, description, version)
      const nextName = payload.name !== undefined ? payload.name : flag.name;
      const nextDesc = payload.description !== undefined ? payload.description : flag.description;

      const [updatedFlag] = await tx
        .update(featureFlags)
        .set({
          name: nextName,
          description: nextDesc,
          version: flag.version + 1,
          updatedBy: actorId ?? null,
          updatedAt: new Date(),
        })
        .where(eq(featureFlags.id, flagId))
        .returning();

      return updatedFlag;
    });
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
