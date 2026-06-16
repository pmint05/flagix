import {
  Inject,
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { eq, and, isNull } from 'drizzle-orm';
import { variations, featureFlags } from '@/db/schema';
import { DATABASE } from '@/modules/database/database.module';
import { type Database } from '@/db';
import { TargetingRulesRepository } from './targeting-rules.repository';
import { FlagChangePublisher } from '../flag-changes/flag-change.publisher';
import {
  generateInitialPriority,
  generatePriorityAfter,
} from '@/common/utils/priority';
import type {
  CreateTargetingRuleDto,
  UpdateTargetingRuleDto,
} from './dto/create-targeting-rule.dto';

@Injectable()
export class TargetingRulesService {
  constructor(
    private readonly rulesRepo: TargetingRulesRepository,
    @Inject(DATABASE) private readonly db: Database,
    @Optional() private readonly flagChangePublisher?: FlagChangePublisher,
  ) {}

  async create(orgId: string, flagId: string, dto: CreateTargetingRuleDto) {
    if (dto.ruleType === 'kill_switch') {
      const existing = await this.rulesRepo.findKillSwitchForFlag(flagId);
      if (existing)
        throw new ConflictException(
          'Kill switch rule already exists for this flag',
        );
    }

    const [variation] = await this.db
      .select()
      .from(variations)
      .where(
        and(
          eq(variations.id, dto.variationId),
          eq(variations.featureFlagId, flagId),
          isNull(variations.deletedAt),
        ),
      )
      .limit(1);

    if (!variation) {
      throw new BadRequestException('Variation does not belong to this flag');
    }

    const lastRule = await this.rulesRepo.findLastRuleForFlag(flagId);
    const priority = lastRule
      ? generatePriorityAfter(lastRule.priority)
      : generateInitialPriority();

    const rule = await this.rulesRepo.create({
      ...dto,
      organizationId: orgId,
      featureFlagId: flagId,
      priority,
    });

    await this.emitRuleChangeEvent('rule.created', rule, flagId);

    return rule;
  }

  async findAllForFlag(orgId: string, flagId: string) {
    return this.rulesRepo.findAllForFlag(flagId);
  }

  async findOne(orgId: string, flagId: string, ruleId: string) {
    const rule = await this.rulesRepo.findById(ruleId);
    if (!rule || rule.organizationId !== orgId || rule.featureFlagId !== flagId)
      throw new NotFoundException('Targeting rule not found');
    return rule;
  }

  async update(
    orgId: string,
    flagId: string,
    ruleId: string,
    dto: UpdateTargetingRuleDto,
  ) {
    const rule = await this.rulesRepo.findById(ruleId);
    if (!rule || rule.organizationId !== orgId || rule.featureFlagId !== flagId)
      throw new NotFoundException('Targeting rule not found');

    const updated = await this.rulesRepo.update(ruleId, dto);
    if (!updated) throw new NotFoundException('Targeting rule not found');

    await this.emitRuleChangeEvent('rule.updated', updated, flagId);

    return updated;
  }

  async remove(orgId: string, flagId: string, ruleId: string) {
    const rule = await this.rulesRepo.findById(ruleId);
    if (!rule || rule.organizationId !== orgId || rule.featureFlagId !== flagId)
      throw new NotFoundException('Targeting rule not found');

    await this.rulesRepo.softDelete(ruleId);

    await this.emitRuleChangeEvent('rule.deleted', rule, flagId);

    return { success: true };
  }

  private async emitRuleChangeEvent(
    eventType: 'rule.created' | 'rule.updated' | 'rule.deleted',
    rule: { id: string },
    flagId: string,
  ): Promise<void> {
    if (!this.flagChangePublisher) return;

    const [flag] = await this.db
      .select({
        key: featureFlags.key,
        environmentId: featureFlags.environmentId,
      })
      .from(featureFlags)
      .where(eq(featureFlags.id, flagId))
      .limit(1);

    if (!flag) return;

    this.flagChangePublisher.publish(flag.environmentId, {
      type: eventType,
      flagKey: flag.key,
      environmentId: flag.environmentId,
      timestamp: new Date().toISOString(),
      metadata: { ruleId: rule.id },
    });
  }
}
