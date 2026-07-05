import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { eq, and, isNull, count, inArray, asc } from 'drizzle-orm';
import {
  featureFlags,
  flagStates,
  variations,
  targetingRules,
  user,
  tags,
  featureFlagsToTags,
  segments,
} from '@/db/schema';
import { DATABASE } from '@/modules/database/database.module';
import { type Database } from '@/db';
import type {
  CreateFeatureFlagDto,
  UpdateFeatureFlagDto,
  PatchFeatureFlagConfigDto,
} from './dto/feature-flag.dto';
import { ListQueryBuilder } from '@/common/utils/list-query-builder';
import type { FeatureFlagListQuery } from '@flagix/shared';
import * as crypto from 'crypto';

const COLOR_KEYS = [
  'red',
  'blue',
  'amber',
  'green',
  'purple',
  'sky',
  'pink',
  'lime',
  'indigo',
  'yellow',
  'teal',
  'fuchsia',
];

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
      .select({
        id: variations.id,
        key: variations.key,
        color: variations.color,
        value: variations.value,
        description: variations.description,
        isDefault: variations.isDefault,
      })
      .from(variations)
      .where(
        and(eq(variations.featureFlagId, flagId), isNull(variations.deletedAt)),
      )
      .orderBy(asc(variations.key));
  }

  async findRulesForFlag(flagId: string, envId: string) {
    return this.db
      .select()
      .from(targetingRules)
      .where(
        and(
          eq(targetingRules.featureFlagId, flagId),
          eq(targetingRules.environmentId, envId),
          isNull(targetingRules.deletedAt),
        ),
      );
  }

  async findAllForEnv(
    projectId: string,
    envId: string,
    query: FeatureFlagListQuery,
  ): Promise<{
    data: Array<{
      id: string;
      organizationId: string;
      projectId: string;
      key: string;
      name: string;
      description: string | null;
      flagType: 'boolean' | 'multivariate';
      visibility: 'all' | 'client_only' | 'server_only';
      version: number;
      isTemporary: boolean;
      createdBy: string | null;
      updatedBy: string | null;
      deletedBy: string | null;
      createdAt: Date;
      updatedAt: Date;
      deletedAt: Date | null;
      isEnabled: boolean;
      status: 'draft' | 'active' | 'archived';
      environmentId: string;
      stateId: string;
      stateVersion: number;
      creator: { id: string; name: string; email: string } | null;
      variationCount: number;
      variations: Array<{ id: string; key: string; color: string | null }>;
    }>;
    total: number;
    page: number;
    pageSize: number;
  }> {
    const baseConditions = [
      eq(featureFlags.projectId, projectId),
      isNull(featureFlags.deletedAt),
      eq(flagStates.environmentId, envId),
      isNull(flagStates.deletedAt),
    ];

    if (query.tags) {
      const tagFilterNames = Array.isArray(query.tags)
        ? query.tags
        : typeof query.tags === "string"
        ? [query.tags]
        : [];
      const cleanTags = tagFilterNames.map((t) => String(t).trim()).filter(Boolean);
      if (cleanTags.length > 0) {
        const flagIdsWithTags = await this.db
          .select({ id: featureFlagsToTags.featureFlagId })
          .from(featureFlagsToTags)
          .innerJoin(tags, eq(featureFlagsToTags.tagId, tags.id))
          .where(and(eq(tags.projectId, projectId), inArray(tags.name, cleanTags)));
        const ids = flagIdsWithTags.map((row: { id: string }) => row.id);
        if (ids.length > 0) {
          baseConditions.push(inArray(featureFlags.id, ids));
        } else {
          baseConditions.push(eq(featureFlags.id, "00000000-0000-0000-0000-000000000000"));
        }
      }
    }

    const builder = new ListQueryBuilder({
      base: baseConditions,
      q: {
        columns: [
          featureFlags.key,
          featureFlags.name,
          featureFlags.description,
        ],
      },
      filters: {
        status: { column: flagStates.status, operator: 'in' },
        flagType: { column: featureFlags.flagType, operator: 'in' },
        visibility: { column: featureFlags.visibility, operator: 'in' },
        isTemporary: { column: featureFlags.isTemporary, operator: 'boolean' },
        creator: { column: featureFlags.createdBy, operator: 'eq' },
        createdAtFrom: { column: featureFlags.createdAt, operator: 'dateFrom' },
        createdAtTo: { column: featureFlags.createdAt, operator: 'dateTo' },
      },
      sort: {
        key: { column: featureFlags.key },
        name: { column: featureFlags.name },
        createdAt: { column: featureFlags.createdAt },
        updatedAt: { column: featureFlags.updatedAt },
        status: { column: flagStates.status },
        flagType: { column: featureFlags.flagType },
      },
      defaultSort: { column: featureFlags.createdAt, direction: 'desc' },
    }).apply(query);

    const where = builder.where;
    const orderBy = builder.orderBy(query.sort);
    const { limit, offset } = builder.pagination(query.page, query.pageSize);

    const [{ total }] = await this.db
      .select({ total: count() })
      .from(featureFlags)
      .innerJoin(flagStates, eq(featureFlags.id, flagStates.featureFlagId))
      .where(where);

    const rows = await this.db
      .select({
        flag: featureFlags,
        state: flagStates,
        creator: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      })
      .from(featureFlags)
      .innerJoin(flagStates, eq(featureFlags.id, flagStates.featureFlagId))
      .leftJoin(user, eq(featureFlags.createdBy, user.id))
      .where(where)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const flagIds = rows.map((r) => r.flag.id);
    const variationRows =
      flagIds.length > 0
        ? await this.db
            .select({
              featureFlagId: variations.featureFlagId,
              id: variations.id,
              key: variations.key,
              color: variations.color,
            })
            .from(variations)
            .where(
              and(
                inArray(variations.featureFlagId, flagIds),
                isNull(variations.deletedAt),
              ),
            )
        : [];

    const variationsByFlag = new Map<
      string,
      Array<{ id: string; key: string; color: string | null }>
    >();
    for (const row of variationRows) {
      const list = variationsByFlag.get(row.featureFlagId) ?? [];
      list.push({ id: row.id, key: row.key, color: row.color });
      variationsByFlag.set(row.featureFlagId, list);
    }

    const tagRows =
      flagIds.length > 0
        ? await this.db
            .select({
              featureFlagId: featureFlagsToTags.featureFlagId,
              tagName: tags.name,
            })
            .from(featureFlagsToTags)
            .innerJoin(tags, eq(featureFlagsToTags.tagId, tags.id))
            .where(inArray(featureFlagsToTags.featureFlagId, flagIds))
        : [];

    const tagsByFlag = new Map<string, string[]>();
    for (const row of tagRows) {
      const list = tagsByFlag.get(row.featureFlagId) ?? [];
      list.push(row.tagName);
      tagsByFlag.set(row.featureFlagId, list);
    }

    const data = rows.map(({ flag, state, creator }) => {
      const flagVariations = variationsByFlag.get(flag.id) ?? [];
      return {
        ...flag,
        isEnabled: state.isEnabled,
        status: state.status as 'draft' | 'active' | 'archived',
        environmentId: state.environmentId,
        stateId: state.id,
        stateVersion: state.version,
        creator: creator?.id
          ? { id: creator.id, name: creator.name, email: creator.email }
          : null,
        variationCount: flagVariations.length,
        variations: flagVariations,
        tags: tagsByFlag.get(flag.id) ?? [],
      };
    });

    return {
      data,
      total,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 20,
    };
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
      color?: string;
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
          visibility: input.visibility ?? 'all',
          isTemporary: input.isTemporary ?? false,
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
            color: v.color ?? null,
          })),
        );
      }

      if (input.tags !== undefined) {
        await this.syncTags(tx, input.organizationId, input.projectId, flag.id, input.tags);
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
    return this.db.transaction(async (tx) => {
      const [flag] = await tx
        .update(featureFlags)
        .set({
          ...(input.name !== undefined && { name: input.name }),
          ...(input.description !== undefined && {
            description: input.description,
          }),
          ...(input.visibility !== undefined && {
            visibility: input.visibility,
          }),
          ...(input.isTemporary !== undefined && {
            isTemporary: input.isTemporary,
          }),
          version: currentVersion + 1,
          updatedBy: actorId ?? null,
        })
        .where(
          and(eq(featureFlags.id, id), eq(featureFlags.version, currentVersion)),
        )
        .returning();

      if (!flag) return null;

      if (input.tags !== undefined) {
        await this.syncTags(tx, flag.organizationId, flag.projectId, flag.id, input.tags);
      }

      return flag;
    });
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
        .where(
          and(
            eq(variations.featureFlagId, flagId),
            isNull(variations.deletedAt),
          ),
        );

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
          // Validate unique keys in payload
          const payloadKeySet = new Set<string>();
          for (const v of payload.variations) {
            if (payloadKeySet.has(v.key)) {
              throw new BadRequestException(`Duplicate variation key "${v.key}" in payload`);
            }
            payloadKeySet.add(v.key);
          }
          // Ensure payload does not conflict with existing variations unless updating same id
          for (const v of payload.variations) {
            const existing = currentVariations.find((cv) => cv.key === v.key);
            if (existing && existing.id !== v.id) {
              throw new BadRequestException(`Variation key "${v.key}" already exists`);
            }
          }
          // Build target variations, preserving IDs when possible
          targetVariations = payload.variations.map((pv) => {
            const id =
              pv.id ||
              currentVariations.find((cv) => cv.key === pv.key)?.id ||
              crypto.randomUUID();
            return {
              id,
              organizationId: orgId,
              featureFlagId: flagId,
              key: pv.key,
              value: pv.value,
              description: pv.description ?? null,
              isDefault: pv.isDefault ?? false,
              color: pv.color ?? null,
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

      const nextDefaultId =
        payload.defaultVariationId ||
        (variationsUpdated
          ? targetVariations.find((v) => v.isDefault)?.id
          : null);

      // 3. Cross-validate Target State
      const validVariationIds = new Set(targetVariations.map((v) => v.id));

      const finalDefaultId =
        nextDefaultId || currentFlagState?.defaultVariationId;
      if (finalDefaultId && !validVariationIds.has(finalDefaultId)) {
        throw new BadRequestException(
          'Default variation does not exist in target variations',
        );
      }

      const finalOffId =
        payload.offVariationId !== undefined
          ? payload.offVariationId
          : currentFlagState?.offVariationId;
      if (finalOffId && !validVariationIds.has(finalOffId)) {
        throw new BadRequestException(
          'Off variation does not exist in target variations',
        );
      }

      for (const rule of targetRules) {
        if (rule.ruleType !== 'percentage') {
          if (!rule.variationId) {
            throw new BadRequestException(
              `Rule of type ${rule.ruleType} must specify a variationId`,
            );
          }
          if (!validVariationIds.has(rule.variationId)) {
            throw new BadRequestException(
              `Rule references non-existent variation: ${rule.variationId}`,
            );
          }
        } else {
          const rollouts = (rule.conditions as any)?.rollouts as
            | Array<{ variationId: string; percentage: number }>
            | undefined;
          if (rollouts && Array.isArray(rollouts)) {
            for (const r of rollouts) {
              if (!validVariationIds.has(r.variationId)) {
                throw new BadRequestException(
                  `Percentage rollout references non-existent variation: ${r.variationId}`,
                );
              }
            }
          }
        }
      }

      // 4. Execute updates in transaction with safe dependency order
      // A. Variations updates (insert / update)
      if (variationsUpdated) {
        await tx
          .update(variations)
          .set({ isDefault: false })
          .where(eq(variations.featureFlagId, flagId));

        const currentIds = new Set(currentVariations.map((cv) => cv.id));
        for (const [index, tv] of targetVariations.entries()) {
          if (currentIds.has(tv.id)) {
            await tx
              .update(variations)
              .set({
                key: tv.key,
                value: tv.value,
                description: tv.description,
                isDefault: tv.isDefault,
                color:
                  tv.color ??
                  currentVariations.find((v) => v.id === tv.id)?.color ??
                  COLOR_KEYS[index % 12],
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
              color: tv.color ?? COLOR_KEYS[index % 12],
            });
          }
        }
      }

      // Validate at least 2 variations exist
      if (variationsUpdated && targetVariations.length < 2) {
        throw new BadRequestException('At least 2 variations are required');
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

      const nextStatus =
      payload.status !== undefined
      ? payload.status
      : (currentFlagState?.status ?? 'draft');
      
      // D. Ensure off variation is set when activating flag
      // if (nextStatus === 'active' && !finalOffId) {
      //   throw new BadRequestException(
      //     'Active flags must have an off variation',
      //   );
      // }

      // E. Update flag states (isEnabled, status, defaultVariationId, offVariationId)
      if (currentFlagState) {
        const nextEnabled =
          payload.isEnabled !== undefined
            ? payload.isEnabled
            : currentFlagState.isEnabled;

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

      // F. Update flag attributes (name, description, version, visibility)
      const nextName = payload.name !== undefined ? payload.name : flag.name;
      const nextDesc =
        payload.description !== undefined
          ? payload.description
          : flag.description;
      const nextVisibility =
        payload.visibility !== undefined ? payload.visibility : flag.visibility;

      const nextIsTemporary =
        payload.isTemporary !== undefined
          ? payload.isTemporary
          : flag.isTemporary;

      const [updatedFlag] = await tx
        .update(featureFlags)
        .set({
          name: nextName,
          description: nextDesc,
          visibility: nextVisibility,
          isTemporary: nextIsTemporary,
          version: flag.version + 1,
          updatedBy: actorId ?? null,
          updatedAt: new Date(),
        })
        .where(eq(featureFlags.id, flagId))
        .returning();

      if (payload.tags !== undefined) {
        await this.syncTags(tx, flag.organizationId, flag.projectId, flag.id, payload.tags);
      }

      return updatedFlag;
    });
  }

  async softDelete(id: string, actorId?: string) {
    return this.db.transaction(async (tx) => {
      const deletedAt = new Date();
      // 1. Soft-delete flag
      const [flag] = await tx
        .update(featureFlags)
        .set({ deletedAt, deletedBy: actorId ?? null })
        .where(eq(featureFlags.id, id))
        .returning();

      if (!flag) return null;

      // 2. Soft-delete flag states
      await tx
        .update(flagStates)
        .set({ deletedAt })
        .where(eq(flagStates.featureFlagId, id));

      // 3. Soft-delete targeting rules
      await tx
        .update(targetingRules)
        .set({ deletedAt })
        .where(eq(targetingRules.featureFlagId, id));

      // 4. Soft-delete variations
      await tx
        .update(variations)
        .set({ deletedAt })
        .where(eq(variations.featureFlagId, id));

      return flag;
    });
  }

  async findTagsForFlag(flagId: string): Promise<string[]> {
    const rows = await this.db
      .select({ name: tags.name })
      .from(featureFlagsToTags)
      .innerJoin(tags, eq(featureFlagsToTags.tagId, tags.id))
      .where(eq(featureFlagsToTags.featureFlagId, flagId));
    return rows.map((r) => r.name);
  }

  private async syncTags(
    tx: any,
    orgId: string,
    projectId: string,
    flagId: string,
    tagNames?: string[],
  ) {
    if (!tagNames) return;

    // Delete existing links
    await tx
      .delete(featureFlagsToTags)
      .where(eq(featureFlagsToTags.featureFlagId, flagId));

    if (tagNames.length === 0) return;

    const uniqueTagNames = [...new Set(tagNames.map((t) => t.trim()).filter(Boolean))];
    if (uniqueTagNames.length === 0) return;

    // Get existing tags
    const existingTags = await tx
      .select()
      .from(tags)
      .where(
        and(
          eq(tags.projectId, projectId),
          inArray(tags.name, uniqueTagNames),
        ),
      );

    const existingNames = new Set(existingTags.map((t: { name: string }) => t.name));
    const tagsToInsert = uniqueTagNames
      .filter((name) => !existingNames.has(name))
      .map((name) => ({
        organizationId: orgId,
        projectId,
        name,
      }));

    let allTags = [...existingTags];

    if (tagsToInsert.length > 0) {
      const newlyCreatedTags = await tx
        .insert(tags)
        .values(tagsToInsert)
        .returning();
      allTags.push(...newlyCreatedTags);
    }

    const associations = allTags.map((t: { id: string }) => ({
      featureFlagId: flagId,
      tagId: t.id,
    }));

    await tx.insert(featureFlagsToTags).values(associations);
  }

  async findReferencedSegments(rules: any[]) {
    const segmentIds: string[] = [];
    for (const rule of rules) {
      if (rule.ruleType === 'segment' && rule.conditions) {
        const conds = rule.conditions as any;
        if (Array.isArray(conds.segmentIds)) {
          segmentIds.push(...conds.segmentIds);
        }
      }
    }

    const referenced: Record<string, { id: string; name: string; key: string }> = {};
    if (segmentIds.length > 0) {
      const dbSegments = await this.db
        .select()
        .from(segments)
        .where(
          and(
            inArray(segments.id, segmentIds),
            isNull(segments.deletedAt),
          ),
        );
      for (const seg of dbSegments) {
        referenced[seg.id] = {
          id: seg.id,
          name: seg.name,
          key: seg.key,
        };
      }
    }
    return referenced;
  }
}
