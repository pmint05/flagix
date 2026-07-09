import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
  Optional,
} from '@nestjs/common';
import { SegmentsRepository } from './segments.repository';
import { FlagConfigCacheService } from '../evaluation/flag-config-cache.service';
import { DATABASE } from '@/modules/database/database.module';
import { type Database } from '@/db';
import { environments, targetingRules, featureFlags } from '@/db/schema';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { CreateSegmentDto } from './dto/create-segment.dto';
import { UpdateSegmentDto } from './dto/update-segment.dto';
import { getActorId } from '@/common/audit/audit-context';
import { FlagChangePublisher } from '../flag-changes/flag-change.publisher';
import { FlagChangeEvent } from '../flag-changes/flag-change.types';
import { AuditLogsService } from '@/modules/audit-logs/audit-logs.service';
import { resolveSegmentAction } from '@/common/audit/resolve-action';
import { sanitizeSegment } from '@/common/audit/sanitize';

@Injectable()
export class SegmentsService {
  constructor(
    private readonly segmentRepo: SegmentsRepository,
    private readonly cacheService: FlagConfigCacheService,
    @Inject(DATABASE) private readonly db: Database,
    private readonly flagChangePublisher: FlagChangePublisher,
    @Optional() private readonly auditLogsService?: AuditLogsService,
  ) {}

  async create(orgId: string, projectId: string, dto: CreateSegmentDto) {
    const existing = await this.segmentRepo.findByProjectAndKey(
      projectId,
      dto.key,
    );
    if (existing) {
      throw new ConflictException('Segment key already exists in this project');
    }

    const actorId = getActorId();
    const segment = await this.segmentRepo.create(
      { ...dto, projectId, organizationId: orgId },
      actorId,
    );

    if (this.auditLogsService) {
      await this.auditLogsService.recordChange({
        organizationId: orgId,
        projectId,
        entityType: 'segment',
        entityId: segment.id,
        before: null,
        after: segment,
        resolveAction: resolveSegmentAction,
        sanitize: sanitizeSegment,
      });
    }

    return segment;
  }

  async findAllForProject(projectId: string) {
    const rows = await this.segmentRepo.findAllForProject(projectId);
    return rows.map((row) => ({
      ...row,
      conditionCount: Array.isArray(row.conditions)
        ? row.conditions.length
        : Array.isArray((row.conditions as any)?.conditions)
          ? (row.conditions as any).conditions.length
          : 0,
    }));
  }

  async findOne(projectId: string, segmentId: string) {
    const segment = await this.segmentRepo.findById(segmentId);
    if (!segment || segment.projectId !== projectId) {
      throw new NotFoundException('Segment not found');
    }
    return segment;
  }

  async findOneBySlug(projectId: string, slug: string) {
    const segment = await this.segmentRepo.findBySlug(projectId, slug);
    if (!segment || segment.projectId !== projectId) {
      throw new NotFoundException('Segment not found');
    }
    return segment;
  }

  async update(projectId: string, segmentId: string, dto: UpdateSegmentDto) {
    const segment = await this.segmentRepo.findById(segmentId);
    if (!segment || segment.projectId !== projectId) {
      throw new NotFoundException('Segment not found');
    }

    const actorId = getActorId();
    const updated = await this.segmentRepo.update(segmentId, dto, actorId);

    if (this.auditLogsService && updated) {
      await this.auditLogsService.recordChange({
        organizationId: segment.organizationId,
        projectId,
        entityType: 'segment',
        entityId: segmentId,
        before: segment,
        after: updated,
        resolveAction: resolveSegmentAction,
        sanitize: sanitizeSegment,
      });
    }

    await this.invalidateFlagsReferencingSegment(segmentId, projectId);

    return updated;
  }

  async remove(projectId: string, segmentId: string) {
    const segment = await this.segmentRepo.findById(segmentId);
    if (!segment || segment.projectId !== projectId) {
      throw new NotFoundException('Segment not found');
    }

    const actorId = getActorId();
    const deleted = await this.segmentRepo.softDelete(segmentId, actorId);

    if (this.auditLogsService && deleted) {
      await this.auditLogsService.recordChange({
        organizationId: segment.organizationId,
        projectId,
        entityType: 'segment',
        entityId: segmentId,
        before: segment,
        after: deleted,
        resolveAction: resolveSegmentAction,
        sanitize: sanitizeSegment,
      });
    }

    await this.invalidateFlagsReferencingSegment(segmentId, projectId);

    return { success: true };
  }

  private async invalidateFlagsReferencingSegment(
    segmentId: string,
    projectId: string,
  ) {
    const rows = await this.db
      .select({
        envId: targetingRules.environmentId,
        flagKey: featureFlags.key,
        visibility: featureFlags.visibility,
      })
      .from(targetingRules)
      .innerJoin(
        featureFlags,
        eq(targetingRules.featureFlagId, featureFlags.id),
      )
      .where(
        and(
          eq(targetingRules.ruleType, 'segment'),
          eq(featureFlags.projectId, projectId),
          isNull(targetingRules.deletedAt),
          isNull(featureFlags.deletedAt),
          sql`jsonb_exists(${targetingRules.conditions}->'segmentIds', ${segmentId})`,
        ),
      );

    const byEnv = new Map<string, Map<string, string | null>>();
    for (const row of rows) {
      const keys = byEnv.get(row.envId) ?? new Map<string, string | null>();
      keys.set(row.flagKey, row.visibility);
      byEnv.set(row.envId, keys);
    }

    for (const [envId, flagMap] of byEnv) {
      const flagKeys = [...flagMap.keys()];
      await this.cacheService.invalidateFlags(envId, flagKeys);
      for (const [flagKey, visibility] of flagMap) {
        this.flagChangePublisher.publish(envId, {
          type: 'flag.updated',
          flagKey,
          timestamp: new Date().toISOString(),
          visibility: visibility as FlagChangeEvent['visibility'],
        });
      }
    }
  }
}
