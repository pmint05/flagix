import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { FeatureFlagsRepository } from './feature-flags.repository';
import { EnvironmentsRepository } from '../environments/environments.repository';
import { FlagChangePublisher } from '../flag-changes/flag-change.publisher';
import { FlagChangeEventType } from '../flag-changes/flag-change.types';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { getActorId } from '@/common/audit/audit-context';
import { EvaluationService } from '../evaluation/evaluation.service';
import { FlagConfigCacheService } from '../evaluation/flag-config-cache.service';
import type { EvaluationContext, FeatureFlagListQuery } from '@flagix/shared';
import {
  resolveFlagAction,
  resolveFlagStateAction,
} from '@/common/audit/resolve-action';
import {
  sanitizeFlag,
  sanitizeRule,
  sanitizeVariation,
  sanitizeState,
} from '@/common/audit/sanitize';
import type {
  CreateFeatureFlagDto,
  UpdateFeatureFlagDto,
  PatchFeatureFlagConfigDto,
} from './dto/feature-flag.dto';

export const COLOR_KEYS = [
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

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ['active'],
  active: ['archived'],
  archived: ['draft'],
};

@Injectable()
export class FeatureFlagsService {
  constructor(
    private readonly flagRepo: FeatureFlagsRepository,
    private readonly envRepo: EnvironmentsRepository,
    private readonly evaluationService: EvaluationService,
    @Optional() private readonly flagChangePublisher?: FlagChangePublisher,
    @Optional() private readonly auditLogsService?: AuditLogsService,
    @Optional() private readonly cache?: FlagConfigCacheService,
  ) {}

  async create(orgId: string, projectId: string, dto: CreateFeatureFlagDto) {
    const existing = await this.flagRepo.findByKey(projectId, dto.key);
    if (existing)
      throw new ConflictException('Flag key already exists within project');

    let variationData: Array<{
      key: string;
      value: unknown;
      description?: string;
      isDefault: boolean;
      color?: string;
    }>;

    if (
      dto.flagType === 'boolean' &&
      (!dto.variations || dto.variations.length === 0)
    ) {
      variationData = [
        { key: 'true', value: true, isDefault: false, color: 'green' },
        { key: 'false', value: false, isDefault: true, color: 'red' },
      ];
    } else if (dto.variations && dto.variations.length > 0) {
      const defaultKey = dto.defaultVariationKey ?? dto.variations[0]?.key;
      variationData = dto.variations.map((v, index) => ({
        key: v.key,
        value: v.value,
        description: v.description,
        isDefault: v.key === defaultKey,
        color: v.color ?? COLOR_KEYS[index % 12],
      }));

      const keys = variationData.map((v) => v.key);
      const duplicateKeys = keys.filter(
        (key, index) => keys.indexOf(key) !== index,
      );
      if (duplicateKeys.length > 0) {
        throw new BadRequestException(
          `Duplicate variation keys: ${[...new Set(duplicateKeys)].join(', ')}`,
        );
      }

      const defaultCount = variationData.filter((v) => v.isDefault).length;
      if (defaultCount === 0) {
        variationData[0].isDefault = true;
      }

      if (variationData.length < 2) {
        throw new BadRequestException('At least 2 variations are required');
      }
    } else {
      throw new BadRequestException(
        'Variations are required for multivariate flags',
      );
    }

    const actorId = getActorId();
    const { flag, variations: createdVariations } =
      await this.flagRepo.createWithVariations(
        { ...dto, organizationId: orgId, projectId },
        variationData,
        actorId,
      );

    // Create flag states for all environments in the project
    const environments = await this.envRepo.findAllForProject(projectId);
    for (const env of environments) {
      await this.flagRepo.upsertFlagState({
        organizationId: orgId,
        featureFlagId: flag.id,
        environmentId: env.id,
        isEnabled: false,
        status: 'draft',
      });
    }

    if (this.flagChangePublisher) {
      for (const env of environments) {
        this.flagChangePublisher.publish(env.id, {
          type: 'flag.created',
          flagKey: flag.key,
          environmentId: env.id,
          timestamp: new Date().toISOString(),
          metadata: {
            version: flag.version,
            isEnabled: false,
          },
        });
      }
    }

    if (this.auditLogsService) {
      await this.auditLogsService.recordChange({
        organizationId: orgId,
        projectId,
        environmentId: undefined,
        entityType: 'feature_flag',
        entityId: flag.id,
        before: null,
        after: flag,
        resolveAction: resolveFlagAction,
        sanitize: sanitizeFlag,
      });
    }

    return { ...flag, variations: createdVariations };
  }

  async findAllForEnv(
    orgId: string,
    projectId: string,
    envId: string,
    query: FeatureFlagListQuery,
  ) {
    return this.flagRepo.findAllForEnv(projectId, envId, query);
  }

  async findOne(orgId: string, flagId: string, envId?: string) {
    const flag = await this.flagRepo.findById(flagId);
    if (!flag || flag.organizationId !== orgId)
      throw new NotFoundException('Feature flag not found');

    const flagVariations = await this.flagRepo.findVariationsForFlag(flagId);
    const flagStates = await this.flagRepo.findFlagStatesForFlag(flagId, envId);
    const rules = envId
      ? await this.flagRepo.findRulesForFlag(flagId, envId)
      : [];
    return { ...flag, variations: flagVariations, states: flagStates, rules };
  }

  async findByKey(
    orgId: string,
    projectId: string,
    key: string,
    envId?: string,
  ) {
    const flag = await this.flagRepo.findByKey(projectId, key);
    if (!flag || flag.organizationId !== orgId)
      throw new NotFoundException('Feature flag not found');

    const flagVariations = await this.flagRepo.findVariationsForFlag(flag.id);
    const flagStates = await this.flagRepo.findFlagStatesForFlag(
      flag.id,
      envId,
    );
    const rules = envId
      ? await this.flagRepo.findRulesForFlag(flag.id, envId)
      : [];
    return { ...flag, variations: flagVariations, states: flagStates, rules };
  }

  async update(orgId: string, flagId: string, dto: UpdateFeatureFlagDto) {
    const result = await this.flagRepo.findByIdWithProject(flagId);
    if (!result || result.organizationId !== orgId)
      throw new NotFoundException('Feature flag not found');

    const flag = result;

    if (dto.version && dto.version !== flag.version) {
      throw new ConflictException(
        'Version conflict (optimistic locking failure)',
      );
    }

    const actorId = getActorId();
    const updated = await this.flagRepo.update(
      flagId,
      dto,
      flag.version,
      actorId,
    );
    if (!updated)
      throw new ConflictException(
        'Version conflict (optimistic locking failure)',
      );

    if (this.auditLogsService) {
      await this.auditLogsService.recordChange({
        organizationId: orgId,
        projectId: flag.projectId,
        entityType: 'feature_flag',
        entityId: flagId,
        before: flag,
        after: updated,
        resolveAction: resolveFlagAction,
        sanitize: sanitizeFlag,
      });
    }

    return updated;
  }

  async updateFlagState(
    orgId: string,
    flagId: string,
    envId: string,
    dto: { isEnabled?: boolean; status?: string },
  ) {
    const flag = await this.flagRepo.findById(flagId);
    if (!flag || flag.organizationId !== orgId)
      throw new NotFoundException('Feature flag not found');

    const currentState = await this.flagRepo.findFlagState(flagId, envId);
    if (!currentState)
      throw new NotFoundException('Flag state not found for this environment');

    if (dto.status && dto.status !== currentState.status) {
      const allowed = VALID_TRANSITIONS[currentState.status] ?? [];
      if (!allowed.includes(dto.status)) {
        throw new BadRequestException(
          `Invalid status transition from "${currentState.status}" to "${dto.status}"`,
        );
      }
    }

    const actorId = getActorId();
    const updated = await this.flagRepo.upsertFlagState({
      organizationId: orgId,
      featureFlagId: flagId,
      environmentId: envId,
      isEnabled: dto.isEnabled ?? currentState.isEnabled,
      status: dto.status ?? currentState.status,
    });

    // Publish flag change event
    if (this.flagChangePublisher) {
      let type: FlagChangeEventType = 'flag.updated';

      if (
        dto.isEnabled !== undefined &&
        dto.isEnabled !== currentState.isEnabled
      ) {
        type = 'flag.toggled';
      } else if (dto.status && dto.status !== currentState.status) {
        if (dto.status === 'archived') {
          type = 'flag.archived';
        }
      }

      this.flagChangePublisher.publish(envId, {
        type,
        flagKey: flag.key,
        environmentId: envId,
        timestamp: new Date().toISOString(),
        metadata: {
          version: updated.version,
          isEnabled: updated.isEnabled,
        },
      });
    }

    if (this.auditLogsService) {
      await this.auditLogsService.recordChange({
        organizationId: orgId,
        projectId: flag.projectId,
        environmentId: envId,
        entityType: 'feature_flag',
        entityId: flagId,
        before: currentState,
        after: updated,
        resolveAction: resolveFlagStateAction,
        sanitize: sanitizeState,
      });
    }

    this.cache?.invalidateFlag(envId, flag.key);

    return updated;
  }

  async patchConfig(
    orgId: string,
    flagId: string,
    envId: string,
    dto: PatchFeatureFlagConfigDto,
  ) {
    if (dto.variations && dto.variations.length > 0) {
      const keys = dto.variations.map((v) => v.key);
      const duplicateKeys = keys.filter(
        (key, index) => keys.indexOf(key) !== index,
      );
      if (duplicateKeys.length > 0) {
        throw new BadRequestException(
          `Duplicate variation keys: ${[...new Set(duplicateKeys)].join(', ')}`,
        );
      }
    }

    const actorId = getActorId();
    const beforeConfig = await this.findOne(orgId, flagId, envId).catch(
      () => null,
    );

    const updated = await this.flagRepo.patchConfig(
      flagId,
      envId,
      orgId,
      dto,
      actorId,
    );

    if (this.auditLogsService && beforeConfig) {
      const afterConfig = await this.findOne(orgId, flagId, envId).catch(
        () => null,
      );

      if (afterConfig) {
        // 1. Visibility Update
        if (beforeConfig.visibility !== afterConfig.visibility) {
          await this.auditLogsService.recordChange({
            organizationId: orgId,
            projectId: updated.projectId,
            environmentId: envId,
            entityType: 'feature_flag',
            entityId: flagId,
            before: { visibility: beforeConfig.visibility },
            after: { visibility: afterConfig.visibility },
            resolveAction: () => 'FLAG_VISIBILITY_UPDATE',
            sanitize: (val) => val,
          });
        }

        // 2. Rules Update
        const areRulesEqual = (b: any[], a: any[]) => {
          const cleanB = JSON.stringify(
            (b ?? []).map((r) => ({
              ruleType: r.ruleType,
              isEnabled: r.isEnabled,
              variationId: r.variationId,
              conditions: r.conditions,
            })),
          );
          const cleanA = JSON.stringify(
            (a ?? []).map((r) => ({
              ruleType: r.ruleType,
              isEnabled: r.isEnabled,
              variationId: r.variationId,
              conditions: r.conditions,
            })),
          );
          return cleanB === cleanA;
        };

        if (!areRulesEqual(beforeConfig.rules, afterConfig.rules)) {
          await this.auditLogsService.recordChange({
            organizationId: orgId,
            projectId: updated.projectId,
            environmentId: envId,
            entityType: 'feature_flag',
            entityId: flagId,
            before: beforeConfig.rules,
            after: afterConfig.rules,
            resolveAction: () => 'FLAG_RULE_UPDATE',
            sanitize: (rules) => rules.map(sanitizeRule),
          });
        }

        // 3. Variations Update
        const areVariationsEqual = (b: any[], a: any[]) => {
          const sortFn = (x: any, y: any) =>
            (x.key || '').localeCompare(y.key || '');
          const sortedB = [...(b ?? [])].sort(sortFn);
          const sortedA = [...(a ?? [])].sort(sortFn);

          const cleanB = JSON.stringify(
            sortedB.map((v) => ({
              key: v.key,
              value: v.value,
              description: v.description,
              isDefault: v.isDefault,
            })),
          );
          const cleanA = JSON.stringify(
            sortedA.map((v) => ({
              key: v.key,
              value: v.value,
              description: v.description,
              isDefault: v.isDefault,
            })),
          );
          return cleanB === cleanA;
        };

        if (
          !areVariationsEqual(beforeConfig.variations, afterConfig.variations)
        ) {
          const sortFn = (x: any, y: any) =>
            (x.key || '').localeCompare(y.key || '');
          const sortedB = [...(beforeConfig.variations ?? [])].sort(sortFn);
          const sortedA = [...(afterConfig.variations ?? [])].sort(sortFn);

          await this.auditLogsService.recordChange({
            organizationId: orgId,
            projectId: updated.projectId,
            environmentId: envId,
            entityType: 'feature_flag',
            entityId: flagId,
            before: sortedB,
            after: sortedA,
            resolveAction: () => 'FLAG_VARIATION_UPDATE',
            sanitize: (variations) => variations.map(sanitizeVariation),
          });
        }

        // 4. State Update (isEnabled or status)
        const stateBefore = beforeConfig.states?.find(
          (s) => s.environmentId === envId,
        );
        const stateAfter = afterConfig.states?.find(
          (s) => s.environmentId === envId,
        );

        if (stateBefore && stateAfter) {
          let stateAction: string | null = null;
          if (stateBefore.status !== stateAfter.status) {
            if (stateAfter.status === 'archived') {
              stateAction = 'FLAG_ARCHIVE';
            } else if (
              stateAfter.status === 'active' &&
              stateBefore.status === 'draft'
            ) {
              stateAction = 'FLAG_ACTIVATE';
            } else {
              stateAction = 'FLAG_UPDATE';
            }
          } else if (stateBefore.isEnabled !== stateAfter.isEnabled) {
            stateAction = 'FLAG_TOGGLE';
          } else if (
            stateBefore.defaultVariationId !== stateAfter.defaultVariationId ||
            stateBefore.offVariationId !== stateAfter.offVariationId
          ) {
            stateAction = 'FLAG_UPDATE';
          }

          if (stateAction) {
            await this.auditLogsService.recordChange({
              organizationId: orgId,
              projectId: updated.projectId,
              environmentId: envId,
              entityType: 'feature_flag',
              entityId: flagId,
              before: stateBefore,
              after: stateAfter,
              resolveAction: () => stateAction!,
              sanitize: sanitizeState,
            });
          }
        }

        // 5. Fallback: if name, description, etc. changed but nothing above matched
        const hasOtherChanges =
          beforeConfig.name !== afterConfig.name ||
          beforeConfig.description !== afterConfig.description ||
          beforeConfig.isTemporary !== afterConfig.isTemporary;

        const matchedAny =
          beforeConfig.visibility !== afterConfig.visibility ||
          !areRulesEqual(beforeConfig.rules, afterConfig.rules) ||
          !areVariationsEqual(
            beforeConfig.variations,
            afterConfig.variations,
          ) ||
          (stateBefore &&
            stateAfter &&
            (stateBefore.status !== stateAfter.status ||
              stateBefore.isEnabled !== stateAfter.isEnabled));

        if (hasOtherChanges && !matchedAny) {
          await this.auditLogsService.recordChange({
            organizationId: orgId,
            projectId: updated.projectId,
            environmentId: envId,
            entityType: 'feature_flag',
            entityId: flagId,
            before: beforeConfig,
            after: afterConfig,
            resolveAction: () => 'FLAG_UPDATE',
            sanitize: sanitizeFlag,
          });
        }
      }
    }

    if (this.flagChangePublisher) {
      const isEnabledState =
        dto.isEnabled !== undefined
          ? dto.isEnabled
          : (beforeConfig?.states?.find((s) => s.environmentId === envId)
              ?.isEnabled ?? false);

      this.flagChangePublisher.publish(envId, {
        type: 'flag.updated',
        flagKey: updated.key,
        environmentId: envId,
        timestamp: new Date().toISOString(),
        metadata: {
          version: updated.version,
          isEnabled: isEnabledState,
        },
      });
    }

    this.cache?.invalidateFlag(envId, updated.key);

    return this.findOne(orgId, flagId, envId);
  }

  async simulate(
    orgId: string,
    flagId: string,
    envId: string,
    context: EvaluationContext,
    flagConfig?: any,
  ) {
    const flag = await this.flagRepo.findById(flagId);
    if (!flag || flag.organizationId !== orgId) {
      throw new NotFoundException('Feature flag not found');
    }

    return this.evaluationService.simulateFlag(
      envId,
      flag.key,
      context,
      flagConfig,
    );
  }

  async remove(orgId: string, flagId: string) {
    const result = await this.flagRepo.findByIdWithProject(flagId);
    if (!result || result.organizationId !== orgId)
      throw new NotFoundException('Feature flag not found');

    const flag = result;

    const actorId = getActorId();
    const deleted = await this.flagRepo.softDelete(flagId, actorId);

    if (this.auditLogsService) {
      await this.auditLogsService.recordChange({
        organizationId: orgId,
        projectId: flag.projectId,
        entityType: 'feature_flag',
        entityId: flagId,
        before: flag,
        after: deleted,
        resolveAction: resolveFlagAction,
        sanitize: sanitizeFlag,
      });
    }

    if (this.cache) {
      const states = await this.flagRepo.findFlagStatesForFlag(flagId);
      for (const state of states) {
        this.cache.invalidateFlag(state.environmentId, flag.key);
      }
    }

    return { success: true };
  }
}
