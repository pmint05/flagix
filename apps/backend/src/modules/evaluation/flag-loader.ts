import { Inject, Injectable } from '@nestjs/common';
import { eq, and, isNull, asc, inArray } from 'drizzle-orm';
import {
  featureFlags,
  flagStates,
  variations,
  targetingRules,
  environments,
  segments,
} from '@/db/schema';
import { DATABASE } from '@/modules/database/database.module';
import { type Database } from '@/db';
import { FlagConfigCacheService } from './flag-config-cache.service';
import type { LoadedFlag, LoadedFlagRule } from './safe-default.util';

@Injectable()
export class FlagLoader {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly cache: FlagConfigCacheService,
  ) {}

  async loadFlag(
    environmentId: string,
    flagKey: string,
    projectId?: string,
  ): Promise<LoadedFlag | null> {
    const cached = await this.cache.getFlagConfig(environmentId, flagKey);
    if (cached) return cached;

    let targetProjectId = projectId;
    if (!targetProjectId) {
      const env = await this.db.query.environments.findFirst({
        where: and(eq(environments.id, environmentId), isNull(environments.deletedAt)),
      });
      if (!env) return null;
      targetProjectId = env.projectId;
    }

    const flag = await this.db.query.featureFlags.findFirst({
      where: and(
        eq(featureFlags.key, flagKey),
        eq(featureFlags.projectId, targetProjectId),
        isNull(featureFlags.deletedAt),
      ),
      with: {
        flagStates: {
          where: and(
            eq(flagStates.environmentId, environmentId),
            isNull(flagStates.deletedAt),
          ),
          limit: 1,
        },
        variations: {
          where: isNull(variations.deletedAt),
        },
        targetingRules: {
          where: and(
            eq(targetingRules.environmentId, environmentId),
            isNull(targetingRules.deletedAt),
          ),
          orderBy: asc(targetingRules.priority),
        },
      },
    });

    if (!flag || !flag.flagStates[0]) return null;

    const state = flag.flagStates[0];

    const segmentIds: string[] = [];
    for (const r of flag.targetingRules) {
      if (r.ruleType === 'segment' && r.conditions) {
        const conds = r.conditions as any;
        if (Array.isArray(conds.segmentIds)) {
          segmentIds.push(...conds.segmentIds);
        }
      }
    }

    const segmentsMap: Record<string, { id: string; key: string; conditions: any }> = {};
    if (segmentIds.length > 0) {
      const dbSegments = await this.db.query.segments.findMany({
        where: and(
          inArray(segments.id, segmentIds),
          isNull(segments.deletedAt),
        ),
      });
      for (const seg of dbSegments) {
        segmentsMap[seg.id] = {
          id: seg.id,
          key: seg.key,
          conditions: seg.conditions,
        };
      }
    }

    const loaded: LoadedFlag = {
      id: flag.id,
      key: flag.key,
      name: flag.name,
      flagType: flag.flagType,
      status: state.status as LoadedFlag['status'],
      isEnabled: state.isEnabled,
      version: state.version,
      offVariationId: state.offVariationId,
      defaultVariationId: state.defaultVariationId,
      variations: flag.variations.map((v) => ({
        id: v.id,
        key: v.key,
        value: v.value as LoadedFlag['variations'][number]['value'],
        isDefault: v.isDefault,
      })),
      rules: flag.targetingRules.map(
        (r): LoadedFlagRule => {
          const conditions = r.conditions as Record<string, unknown>;
          return {
            id: r.id,
            ruleType: r.ruleType,
            priority: r.priority,
            variationId: r.variationId,
            conditions,
            isEnabled: r.isEnabled,
          };
        },
      ),
      visibility: flag.visibility,
      segments: segmentsMap,
    };

    await this.cache.setFlagConfig(environmentId, flagKey, loaded);
    return loaded;
  }

  async loadAllActiveFlags(environmentId: string): Promise<LoadedFlag[]> {
    const cached = await this.cache.getAllFlagConfigs(environmentId);
    if (cached) return cached;

    const states = await this.db.query.flagStates.findMany({
      where: and(
        eq(flagStates.environmentId, environmentId),
        eq(flagStates.status, 'active'),
        isNull(flagStates.deletedAt),
      ),
      with: {
        featureFlag: {
          with: {
            variations: {
              where: isNull(variations.deletedAt),
            },
            targetingRules: {
              where: and(
                eq(targetingRules.environmentId, environmentId),
                isNull(targetingRules.deletedAt),
              ),
              orderBy: asc(targetingRules.priority),
            },
          },
        },
      },
    });

    const allSegmentIds: string[] = [];
    for (const state of states) {
      if (state.featureFlag?.targetingRules) {
        for (const r of state.featureFlag.targetingRules) {
          if (r.ruleType === 'segment' && r.conditions) {
            const conds = r.conditions as any;
            if (Array.isArray(conds.segmentIds)) {
              allSegmentIds.push(...conds.segmentIds);
            }
          }
        }
      }
    }

    const segmentsMap: Record<string, { id: string; key: string; conditions: any }> = {};
    if (allSegmentIds.length > 0) {
      const dbSegments = await this.db.query.segments.findMany({
        where: and(
          inArray(segments.id, allSegmentIds),
          isNull(segments.deletedAt),
        ),
      });
      for (const seg of dbSegments) {
        segmentsMap[seg.id] = {
          id: seg.id,
          key: seg.key,
          conditions: seg.conditions,
        };
      }
    }

    const loaded: LoadedFlag[] = states
      .filter(
        (
          s,
        ): s is typeof s & { featureFlag: NonNullable<typeof s.featureFlag> } =>
          s.featureFlag != null && s.featureFlag.deletedAt == null,
      )
      .map((s) => {
        const flag = s.featureFlag;
        
        // Filter segments map for this flag
        const flagSegmentIds = new Set<string>();
        for (const r of flag.targetingRules) {
          if (r.ruleType === 'segment' && r.conditions) {
            const conds = r.conditions as any;
            if (Array.isArray(conds.segmentIds)) {
              conds.segmentIds.forEach((id: string) => flagSegmentIds.add(id));
            }
          }
        }
        
        const flagSegments: Record<string, { id: string; key: string; conditions: any }> = {};
        flagSegmentIds.forEach((id) => {
          if (segmentsMap[id]) {
            flagSegments[id] = segmentsMap[id];
          }
        });

        return {
          id: flag.id,
          key: flag.key,
          name: flag.name,
          flagType: flag.flagType,
          status: s.status as LoadedFlag['status'],
          isEnabled: s.isEnabled,
          version: s.version,
          offVariationId: s.offVariationId,
          defaultVariationId: s.defaultVariationId,
          variations: flag.variations.map((v) => ({
            id: v.id,
            key: v.key,
            value: v.value as LoadedFlag['variations'][number]['value'],
            isDefault: v.isDefault,
          })),
          rules: flag.targetingRules.map(
            (r): LoadedFlagRule => {
              const conditions = r.conditions as Record<string, unknown>;
              return {
                id: r.id,
                ruleType: r.ruleType,
                priority: r.priority,
                variationId: r.variationId,
                conditions,
                isEnabled: r.isEnabled,
              };
            },
          ),
          visibility: flag.visibility,
          segments: flagSegments,
        };
      });

    await this.cache.setAllFlagConfigs(environmentId, loaded);
    return loaded;
  }
}
