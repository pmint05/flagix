import { Inject, Injectable } from '@nestjs/common';
import { eq, and, isNull, asc } from 'drizzle-orm';
import { targetingRules, variations } from '@/db/schema';
import { DATABASE } from '@/modules/database/database.module';
import { type Database } from '@/db';
import type {
  CreateTargetingRuleDto,
  UpdateTargetingRuleDto,
} from './dto/create-targeting-rule.dto';

@Injectable()
export class TargetingRulesRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async findById(id: string) {
    const [rule] = await this.db
      .select()
      .from(targetingRules)
      .where(and(eq(targetingRules.id, id), isNull(targetingRules.deletedAt)))
      .limit(1);
    return rule ?? null;
  }

  async findAllForFlag(flagId: string) {
    return this.db
      .select()
      .from(targetingRules)
      .where(
        and(
          eq(targetingRules.featureFlagId, flagId),
          isNull(targetingRules.deletedAt),
        ),
      )
      .orderBy(asc(targetingRules.priority));
  }

  async findKillSwitchForFlag(flagId: string) {
    const [rule] = await this.db
      .select()
      .from(targetingRules)
      .where(
        and(
          eq(targetingRules.featureFlagId, flagId),
          eq(targetingRules.ruleType, 'kill_switch'),
          isNull(targetingRules.deletedAt),
        ),
      )
      .limit(1);
    return rule ?? null;
  }

  async findVariationForFlag(flagId: string, variationId: string) {
    const [variation] = await this.db
      .select()
      .from(variations)
      .where(
        and(
          eq(variations.id, variationId),
          eq(variations.featureFlagId, flagId),
          isNull(variations.deletedAt),
        ),
      )
      .limit(1);
    return variation ?? null;
  }

  async findLastRuleForFlag(flagId: string) {
    const rules = await this.db
      .select()
      .from(targetingRules)
      .where(
        and(
          eq(targetingRules.featureFlagId, flagId),
          isNull(targetingRules.deletedAt),
        ),
      )
      .orderBy(asc(targetingRules.priority))
      .limit(1000);

    return rules.length > 0 ? rules[rules.length - 1] : null;
  }

  async create(
    input: CreateTargetingRuleDto & {
      organizationId: string;
      featureFlagId: string;
      priority: string;
    },
    actorId?: string,
  ) {
    const [rule] = await this.db
      .insert(targetingRules)
      .values({
        organizationId: input.organizationId,
        featureFlagId: input.featureFlagId,
        ruleType: input.ruleType,
        priority: input.priority,
        variationId: input.variationId,
        conditions: input.conditions,
        isEnabled: input.isEnabled ?? true,
        createdBy: actorId ?? null,
      })
      .returning();
    return rule;
  }

  async update(id: string, input: UpdateTargetingRuleDto, actorId?: string) {
    const [rule] = await this.db
      .update(targetingRules)
      .set({
        ...(input.variationId !== undefined && {
          variationId: input.variationId,
        }),
        ...(input.conditions !== undefined && { conditions: input.conditions }),
        ...(input.isEnabled !== undefined && { isEnabled: input.isEnabled }),
        ...(input.priority !== undefined && { priority: input.priority }),
        updatedBy: actorId ?? null,
      })
      .where(eq(targetingRules.id, id))
      .returning();
    return rule ?? null;
  }

  async softDelete(id: string, actorId?: string) {
    const [rule] = await this.db
      .update(targetingRules)
      .set({ deletedAt: new Date(), deletedBy: actorId ?? null })
      .where(eq(targetingRules.id, id))
      .returning();
    return rule ?? null;
  }
}
