import {
  Inject,
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { eq, and, isNull } from 'drizzle-orm';
import { variations } from '@/db/schema';
import { DATABASE } from '@/modules/database/database.module';
import { type Database } from '@/db';
import { TargetingRulesRepository } from './targeting-rules.repository';
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

    return this.rulesRepo.create({
      ...dto,
      organizationId: orgId,
      featureFlagId: flagId,
      priority,
    });
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
    return updated;
  }

  async remove(orgId: string, flagId: string, ruleId: string) {
    const rule = await this.rulesRepo.findById(ruleId);
    if (!rule || rule.organizationId !== orgId || rule.featureFlagId !== flagId)
      throw new NotFoundException('Targeting rule not found');

    await this.rulesRepo.softDelete(ruleId);
    return { success: true };
  }
}
