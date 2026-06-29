import { Inject, Injectable } from '@nestjs/common';
import { eq, and, isNull, asc } from 'drizzle-orm';
import {
  featureFlags,
  flagStates,
  variations,
  targetingRules,
} from '@/db/schema';
import { DATABASE } from '@/modules/database/database.module';
import { type Database } from '@/db';
import type { LoadedFlag, LoadedFlagRule } from './safe-default.util';

@Injectable()
export class FlagLoader {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async loadFlag(
    environmentId: string,
    flagKey: string,
  ): Promise<LoadedFlag | null> {
    const flag = await this.db.query.featureFlags.findFirst({
      where: and(eq(featureFlags.key, flagKey), isNull(featureFlags.deletedAt)),
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

    return {
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
        (r): LoadedFlagRule => ({
          id: r.id,
          ruleType: r.ruleType,
          priority: r.priority,
          variationId: r.variationId,
          conditions: r.conditions as Record<string, unknown>,
          isEnabled: r.isEnabled,
        }),
      ),
    };
  }

  async loadAllActiveFlags(environmentId: string): Promise<LoadedFlag[]> {
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

    return states
      .filter(
        (
          s,
        ): s is typeof s & { featureFlag: NonNullable<typeof s.featureFlag> } =>
          s.featureFlag != null && s.featureFlag.deletedAt == null,
      )
      .map((s) => {
        const flag = s.featureFlag;
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
            (r): LoadedFlagRule => ({
              id: r.id,
              ruleType: r.ruleType,
              priority: r.priority,
              variationId: r.variationId,
              conditions: r.conditions as Record<string, unknown>,
              isEnabled: r.isEnabled,
            }),
          ),
        };
      });
  }
}
