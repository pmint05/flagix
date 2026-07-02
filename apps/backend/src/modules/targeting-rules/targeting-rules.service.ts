import {
  Inject,
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { featureFlags } from '@/db/schema';
import { DATABASE } from '@/modules/database/database.module';
import { type Database } from '@/db';
import { TargetingRulesRepository } from './targeting-rules.repository';
import { FlagChangePublisher } from '../flag-changes/flag-change.publisher';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { getActorId } from '@/common/audit/audit-context';
import { resolveRuleAction } from '@/common/audit/resolve-action';
import { sanitizeRule } from '@/common/audit/sanitize';
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
    @Optional() private readonly auditLogsService?: AuditLogsService,
  ) {}

  async create(orgId: string, flagId: string, dto: CreateTargetingRuleDto) {
    if (!dto.environmentId) {
      throw new BadRequestException('environmentId is required');
    }

    if (dto.ruleType === 'kill_switch') {
      const existing = await this.rulesRepo.findKillSwitchForFlag(flagId);
      if (existing)
        throw new ConflictException(
          'Kill switch rule already exists for this flag',
        );
    }

    if (dto.variationId) {
      const variation = await this.rulesRepo.findVariationForFlag(
        flagId,
        dto.variationId,
      );
      if (!variation) {
        throw new BadRequestException('Variation does not belong to this flag');
      }
    } else if (dto.ruleType !== 'percentage') {
      throw new BadRequestException(
        'variationId is required for this rule type',
      );
    }

    const lastRule = await this.rulesRepo.findLastRuleForFlag(flagId);
    const priority = lastRule
      ? generatePriorityAfter(lastRule.priority)
      : generateInitialPriority();

    const actorId = getActorId();
    const rule = await this.rulesRepo.create(
      {
        ...dto,
        organizationId: orgId,
        featureFlagId: flagId,
        environmentId: dto.environmentId,
        priority,
      },
      actorId,
    );

    const flag = await this.getFlagWithProject(flagId);

    this.emitRuleChangeEvent('rule.created', rule, flag, rule.environmentId);

    if (this.auditLogsService) {
      await this.auditLogsService.recordChange({
        organizationId: orgId,
        projectId: flag?.projectId,
        environmentId: rule.environmentId,
        entityType: 'feature_flag',
        entityId: flagId,
        before: null,
        after: rule,
        resolveAction: () => 'FLAG_RULE_UPDATE',
        sanitize: sanitizeRule,
      });
    }

    return rule;
  }

  async findAllForFlag(orgId: string, flagId: string, envId?: string) {
    if (envId) {
      return this.rulesRepo.findAllForFlagAndEnv(flagId, envId);
    }
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

    const actorId = getActorId();
    const updated = await this.rulesRepo.update(ruleId, dto, actorId);
    if (!updated) throw new NotFoundException('Targeting rule not found');

    const flag = await this.getFlagWithProject(flagId);

    this.emitRuleChangeEvent(
      'rule.updated',
      updated,
      flag,
      updated.environmentId,
    );

    if (this.auditLogsService) {
      await this.auditLogsService.recordChange({
        organizationId: orgId,
        projectId: flag?.projectId,
        environmentId: updated.environmentId,
        entityType: 'feature_flag',
        entityId: flagId,
        before: rule,
        after: updated,
        resolveAction: () => 'FLAG_RULE_UPDATE',
        sanitize: sanitizeRule,
      });
    }

    return updated;
  }

  async remove(orgId: string, flagId: string, ruleId: string) {
    const rule = await this.rulesRepo.findById(ruleId);
    if (!rule || rule.organizationId !== orgId || rule.featureFlagId !== flagId)
      throw new NotFoundException('Targeting rule not found');

    const actorId = getActorId();
    const deleted = await this.rulesRepo.softDelete(ruleId, actorId);

    const flag = await this.getFlagWithProject(flagId);

    this.emitRuleChangeEvent('rule.deleted', rule, flag, rule.environmentId);

    if (this.auditLogsService) {
      await this.auditLogsService.recordChange({
        organizationId: orgId,
        projectId: flag?.projectId,
        environmentId: rule.environmentId,
        entityType: 'feature_flag',
        entityId: flagId,
        before: rule,
        after: deleted,
        resolveAction: () => 'FLAG_RULE_UPDATE',
        sanitize: sanitizeRule,
      });
    }

    return { success: true };
  }

  private async getFlagWithProject(flagId: string) {
    const [flag] = await this.db
      .select({
        key: featureFlags.key,
        projectId: featureFlags.projectId,
      })
      .from(featureFlags)
      .where(eq(featureFlags.id, flagId))
      .limit(1);
    return flag;
  }

  private emitRuleChangeEvent(
    eventType: 'rule.created' | 'rule.updated' | 'rule.deleted',
    rule: { id: string },
    flag: { key: string } | null,
    environmentId: string,
  ): void {
    if (!this.flagChangePublisher || !flag) return;

    this.flagChangePublisher.publish(environmentId, {
      type: eventType,
      flagKey: flag.key,
      environmentId,
      timestamp: new Date().toISOString(),
      metadata: { ruleId: rule.id },
    });
  }
}
