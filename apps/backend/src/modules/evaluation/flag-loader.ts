import { Inject, Injectable } from '@nestjs/common';
import { eq, and, isNull, asc } from 'drizzle-orm';
import { featureFlags, variations, targetingRules } from '@/db/schema';
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
      where: and(
        eq(featureFlags.environmentId, environmentId),
        eq(featureFlags.key, flagKey),
        isNull(featureFlags.deletedAt),
      ),
      with: {
        variations: {
          where: isNull(variations.deletedAt),
        },
        targetingRules: {
          where: isNull(targetingRules.deletedAt),
          orderBy: asc(targetingRules.priority),
        },
      },
    });

    if (!flag) return null;

    return {
      id: flag.id,
      key: flag.key,
      name: flag.name,
      flagType: flag.flagType,
      status: flag.status,
      isEnabled: flag.isEnabled,
      version: flag.version,
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
    const flags = await this.db.query.featureFlags.findMany({
      where: and(
        eq(featureFlags.environmentId, environmentId),
        eq(featureFlags.status, 'active'),
        isNull(featureFlags.deletedAt),
      ),
      with: {
        variations: {
          where: isNull(variations.deletedAt),
        },
        targetingRules: {
          where: isNull(targetingRules.deletedAt),
          orderBy: asc(targetingRules.priority),
        },
      },
    });

    return flags.map((flag) => ({
      id: flag.id,
      key: flag.key,
      name: flag.name,
      flagType: flag.flagType,
      status: flag.status,
      isEnabled: flag.isEnabled,
      version: flag.version,
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
    }));
  }
}
