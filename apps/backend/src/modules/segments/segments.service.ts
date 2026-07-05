import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
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

@Injectable()
export class SegmentsService {
  constructor(
    private readonly segmentRepo: SegmentsRepository,
    private readonly cacheService: FlagConfigCacheService,
    @Inject(DATABASE) private readonly db: Database,
    private readonly flagChangePublisher: FlagChangePublisher,
  ) {}

  async create(orgId: string, projectId: string, dto: CreateSegmentDto) {
    const existing = await this.segmentRepo.findByProjectAndKey(projectId, dto.key);
    if (existing) {
      throw new ConflictException('Segment key already exists in this project');
    }

    const actorId = getActorId();
    return this.segmentRepo.create(
      { ...dto, projectId, organizationId: orgId },
      actorId,
    );
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

    // Invalidate only flags that reference this segment
    await this.invalidateFlagsReferencingSegment(segmentId, projectId);

    return updated;
  }

  async remove(projectId: string, segmentId: string) {
    const segment = await this.segmentRepo.findById(segmentId);
    if (!segment || segment.projectId !== projectId) {
      throw new NotFoundException('Segment not found');
    }

    const actorId = getActorId();
    await this.segmentRepo.softDelete(segmentId, actorId);

    // Invalidate only flags that reference this segment
    await this.invalidateFlagsReferencingSegment(segmentId, projectId);

    return { success: true };
  }

  private async invalidateFlagsReferencingSegment(
    segmentId: string,
    projectId: string,
  ) {
    // Find all flags that reference this segment via targeting rules
    const rows = await this.db
      .select({
        envId: targetingRules.environmentId,
        flagKey: featureFlags.key,
      })
      .from(targetingRules)
      .innerJoin(featureFlags, eq(targetingRules.featureFlagId, featureFlags.id))
      .where(
        and(
          eq(targetingRules.ruleType, 'segment'),
          eq(featureFlags.projectId, projectId),
          isNull(targetingRules.deletedAt),
          isNull(featureFlags.deletedAt),
          sql`jsonb_exists(${targetingRules.conditions}->'segmentIds', ${segmentId})`,
        ),
      );

    // Group by environment and invalidate
    const byEnv = new Map<string, string[]>();
    for (const row of rows) {
      const keys = byEnv.get(row.envId) ?? [];
      keys.push(row.flagKey);
      byEnv.set(row.envId, keys);
    }

    for (const [envId, flagKeys] of byEnv) {
      await this.cacheService.invalidateFlags(envId, flagKeys);
      for (const flagKey of flagKeys) {
        this.flagChangePublisher.publish(envId, {
          type: 'flag.updated',
          flagKey,
          timestamp: new Date().toISOString(),
        });
      }
    }
  }
}
