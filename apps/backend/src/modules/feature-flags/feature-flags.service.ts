import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { FeatureFlagsRepository } from './feature-flags.repository';
import { FlagChangePublisher } from '../flag-changes/flag-change.publisher';
import { FlagChangeEventType } from '../flag-changes/flag-change.types';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { getActorId } from '@/common/audit/audit-context';
import { resolveFlagAction } from '@/common/audit/resolve-action';
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
    @Optional() private readonly flagChangePublisher?: FlagChangePublisher,
    @Optional() private readonly auditLogsService?: AuditLogsService,
  ) {}

  async create(
    orgId: string,
    projectId: string,
    envId: string,
    dto: CreateFeatureFlagDto,
  ) {
    const existing = await this.flagRepo.findByKey(envId, dto.key);
    if (existing)
      throw new ConflictException('Flag key already exists within environment');

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
    const { flag, variations: createdVariations } = await this.flagRepo.createWithVariations(
      { ...dto, organizationId: orgId, environmentId: envId },
      variationData,
      actorId,
    );

    if (this.flagChangePublisher) {
      this.flagChangePublisher.publish(envId, {
        type: 'flag.created',
        flagKey: flag.key,
        environmentId: envId,
        timestamp: new Date().toISOString(),
        metadata: { version: flag.version },
      });
    }

    if (this.auditLogsService) {
      await this.auditLogsService.recordChange({
        organizationId: orgId,
        projectId: projectId,
        environmentId: envId,
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
    return { ...flag, variations: flagVariations };
  }

  async update(orgId: string, flagId: string, dto: UpdateFeatureFlagDto) {
    const result = await this.flagRepo.findByIdWithProject(flagId);
    if (!result || result.flag.organizationId !== orgId)
      throw new NotFoundException('Feature flag not found');

    const { flag, projectId } = result;

    if (dto.status && dto.status !== flag.status) {
      const allowed = VALID_TRANSITIONS[flag.status] ?? [];
      if (!allowed.includes(dto.status)) {
        throw new BadRequestException(
          `Invalid status transition from "${flag.status}" to "${dto.status}"`,
        );
      }
    }

    const version = dto.version ?? flag.version;
    if (version !== flag.version) {
      throw new ConflictException(
        'Version conflict (optimistic locking failure)',
      );
    }

    const actorId = getActorId();
    const updated = await this.flagRepo.update(flagId, dto, flag.version, actorId);
    if (!updated)
      throw new ConflictException(
        'Version conflict (optimistic locking failure)',
      );

    this.emitFlagChangeEvent(flag, updated);

    if (this.auditLogsService) {
      await this.auditLogsService.recordChange({
        organizationId: orgId,
        projectId,
        environmentId: flag.environmentId,
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

  async remove(orgId: string, flagId: string) {
    const result = await this.flagRepo.findByIdWithProject(flagId);
    if (!result || result.flag.organizationId !== orgId)
      throw new NotFoundException('Feature flag not found');

    const { flag, projectId } = result;

    const actorId = getActorId();
    const deleted = await this.flagRepo.softDelete(flagId, actorId);

    if (this.flagChangePublisher) {
      this.flagChangePublisher.publish(flag.environmentId, {
        type: 'flag.deleted',
        flagKey: flag.key,
        environmentId: flag.environmentId,
        timestamp: new Date().toISOString(),
      });
    }

    if (this.auditLogsService) {
      await this.auditLogsService.recordChange({
        organizationId: orgId,
        projectId,
        environmentId: flag.environmentId,
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

  private emitFlagChangeEvent(
    before: {
      isEnabled: boolean;
      status: string;
      key: string;
      environmentId: string;
    },
    after: {
      isEnabled: boolean;
      status: string;
      key: string;
      environmentId: string;
      version: number;
    },
  ): void {
    if (!this.flagChangePublisher) return;

    let type: FlagChangeEventType = 'flag.updated';

    if (before.isEnabled !== after.isEnabled) {
      type = 'flag.toggled';
    } else if (before.status !== after.status) {
      if (after.status === 'archived') {
        type = 'flag.archived';
      }
    }

    this.flagChangePublisher.publish(after.environmentId, {
      type,
      flagKey: after.key,
      environmentId: after.environmentId,
      timestamp: new Date().toISOString(),
      metadata: {
        version: after.version,
        isEnabled: after.isEnabled,
      },
    });
  }
}
