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
import {
  resolveFlagAction,
  resolveFlagStateAction,
} from '@/common/audit/resolve-action';
import { sanitizeFlag } from '@/common/audit/sanitize';
import type {
  CreateFeatureFlagDto,
  UpdateFeatureFlagDto,
} from './dto/create-feature-flag.dto';

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ['active'],
  active: ['archived'],
  archived: [],
};

@Injectable()
export class FeatureFlagsService {
  constructor(
    private readonly flagRepo: FeatureFlagsRepository,
    private readonly envRepo: EnvironmentsRepository,
    @Optional() private readonly flagChangePublisher?: FlagChangePublisher,
    @Optional() private readonly auditLogsService?: AuditLogsService,
  ) {}

  async create(
    orgId: string,
    projectId: string,
    dto: CreateFeatureFlagDto,
  ) {
    const existing = await this.flagRepo.findByKey(projectId, dto.key);
    if (existing)
      throw new ConflictException('Flag key already exists within project');

    let variationData: Array<{
      key: string;
      value: unknown;
      description?: string;
      isDefault: boolean;
    }>;

    if (
      dto.flagType === 'boolean' &&
      (!dto.variations || dto.variations.length === 0)
    ) {
      variationData = [
        { key: 'true', value: true, isDefault: false },
        { key: 'false', value: false, isDefault: true },
      ];
    } else if (dto.variations && dto.variations.length > 0) {
      const defaultKey = dto.defaultVariationKey ?? dto.variations[0]?.key;
      variationData = dto.variations.map((v) => ({
        key: v.key,
        value: v.value,
        description: v.description,
        isDefault: v.key === defaultKey,
      }));

      const defaultCount = variationData.filter((v) => v.isDefault).length;
      if (defaultCount === 0) {
        variationData[0].isDefault = true;
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

    // We skip publishing to redis on create since no envId is tied to the action
    // If needed, we could publish to all environments.

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

  async findAllForEnv(orgId: string, envId: string, statusFilter?: string) {
    return this.flagRepo.findAllForEnv(envId, statusFilter);
  }

  async findOne(orgId: string, flagId: string) {
    const flag = await this.flagRepo.findById(flagId);
    if (!flag || flag.organizationId !== orgId)
      throw new NotFoundException('Feature flag not found');

    const flagVariations = await this.flagRepo.findVariationsForFlag(flagId);
    const flagStates = await this.flagRepo.findFlagStatesForFlag(flagId);
    return { ...flag, variations: flagVariations, states: flagStates };
  }

  async findByKey(orgId: string, projectId: string, key: string) {
    const flag = await this.flagRepo.findByKey(projectId, key);
    console.log(flag)
    if (!flag || flag.organizationId !== orgId)
      throw new NotFoundException('Feature flag not found');

    const flagVariations = await this.flagRepo.findVariationsForFlag(flag.id);
    const flagStates = await this.flagRepo.findFlagStatesForFlag(flag.id);
    return { ...flag, variations: flagVariations, states: flagStates };
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
        entityType: 'flag_state',
        entityId: flagId,
        before: currentState,
        after: updated,
        resolveAction: resolveFlagStateAction,
        sanitize: sanitizeFlag,
      });
    }

    return updated;
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

    return { success: true };
  }
}
