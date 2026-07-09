import { Inject, Injectable } from '@nestjs/common';
import { eq, and, desc, sql, type SQL, or, ilike, count, isNull } from 'drizzle-orm';
import {
  auditLogs,
  user,
  projects,
  environments,
  targetingRules,
  variations,
  featureFlags,
  segments,
  tags,
} from '@/db/schema';
import { DATABASE } from '@/modules/database/database.module';
import { type Database } from '@/db';
import { ListQueryBuilder } from '@/common/utils/list-query-builder';

export interface AuditLogQuery {
  orgId: string;
  projectId?: string;
  environmentId?: string;
  entityType?: string;
  actionType?: string;
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
  actorId?: string;
  actorEmail?: string;
  entityId?: string;
  search?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}

@Injectable()
export class AuditLogsRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async findById(id: string) {
    const [log] = await this.db
      .select({
        id: auditLogs.id,
        organizationId: auditLogs.organizationId,
        projectId: auditLogs.projectId,
        environmentId: auditLogs.environmentId,
        actionType: auditLogs.actionType,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        actorId: auditLogs.actorId,
        actorType: auditLogs.actorType,
        actorEmail: auditLogs.actorEmail,
        actorIp: auditLogs.actorIp,
        userAgent: auditLogs.userAgent,
        requestId: auditLogs.requestId,
        requestMethod: auditLogs.requestMethod,
        requestPath: auditLogs.requestPath,
        source: auditLogs.source,
        description: auditLogs.description,
        changes: auditLogs.changes,
        timestamp: auditLogs.timestamp,
        projectName: projects.name,
        projectSlug: projects.slug,
        environmentName: environments.name,
        environmentSlug: environments.slug,
        actorName: user.name,
        actorImage: user.image,
        flagName: featureFlags.name,
        flagKey: featureFlags.key,
        segmentName: segments.name,
        segmentKey: segments.key,
        tagName: tags.name,
      })
      .from(auditLogs)
      .leftJoin(projects, eq(auditLogs.projectId, projects.id))
      .leftJoin(environments, eq(auditLogs.environmentId, environments.id))
      .leftJoin(user, eq(auditLogs.actorId, user.id))
      .leftJoin(targetingRules, eq(auditLogs.entityId, targetingRules.id))
      .leftJoin(variations, eq(auditLogs.entityId, variations.id))
      .leftJoin(
        featureFlags,
        or(
          eq(auditLogs.entityId, featureFlags.id),
          eq(targetingRules.featureFlagId, featureFlags.id),
          eq(variations.featureFlagId, featureFlags.id),
        ),
      )
      .leftJoin(segments, eq(auditLogs.entityId, segments.id))
      .leftJoin(tags, eq(auditLogs.entityId, tags.id))
      .where(eq(auditLogs.id, id))
      .limit(1);
    return log ?? null;
  }

  async findMany(query: AuditLogQuery) {
    const baseConditions: SQL[] = [eq(auditLogs.organizationId, query.orgId)];
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (query.search && query.search.trim()) {
      const term = `%${query.search.trim()}%`;
      const searchConditions = [
        ilike(auditLogs.actorEmail, term),
        ilike(auditLogs.description, term),
        ilike(projects.name, term),
        ilike(projects.slug, term),
        ilike(environments.name, term),
        ilike(environments.slug, term),
        ilike(featureFlags.name, term),
        ilike(featureFlags.key, term),
      ];

      if (uuidRegex.test(query.search.trim())) {
        searchConditions.push(eq(auditLogs.entityId, query.search.trim()));
      }

      baseConditions.push(or(...searchConditions)!);
    }

    let validEntityId: string | undefined = undefined;
    if (query.entityId && query.entityId.trim()) {
      const entityIdTrimmed = query.entityId.trim();
      if (uuidRegex.test(entityIdTrimmed)) {
        validEntityId = entityIdTrimmed;
      } else {
        const term = `%${entityIdTrimmed}%`;
        baseConditions.push(
          or(
            ilike(featureFlags.name, term),
            ilike(featureFlags.key, term),
            ilike(projects.name, term),
            ilike(projects.slug, term),
            ilike(environments.name, term),
            ilike(environments.slug, term),
            ilike(auditLogs.description, term),
          )!,
        );
      }
    }

    if (query.environmentId) {
      baseConditions.push(
        or(
          eq(auditLogs.environmentId, query.environmentId),
          isNull(auditLogs.environmentId),
        )!,
      );
    }

    const builder = new ListQueryBuilder({
      base: baseConditions,
      filters: {
        projectId: { column: auditLogs.projectId },
        entityType: { column: auditLogs.entityType },
        actionType: { column: auditLogs.actionType },
        actorId: { column: auditLogs.actorId },
        actorEmail: { column: auditLogs.actorEmail },
        entityId: { column: auditLogs.entityId },
        from: { column: auditLogs.timestamp, operator: 'dateFrom' },
        to: { column: auditLogs.timestamp, operator: 'dateTo' },
      },
      sort: {
        timestamp: { column: auditLogs.timestamp },
        actionType: { column: auditLogs.actionType },
        entityType: { column: auditLogs.entityType },
      },
      defaultSort: { column: auditLogs.timestamp, direction: 'desc' },
    }).apply({
      ...query,
      entityId: validEntityId,
      from: query.from?.toISOString(),
      to: query.to?.toISOString(),
      q: undefined,
    } as any);

    const where = builder.where;
    const orderBy = builder.orderBy(query.sort);
    const { limit, offset } = builder.pagination(query.page, query.pageSize);

    const [rows, countResult] = await Promise.all([
      this.db
        .select({
          id: auditLogs.id,
          organizationId: auditLogs.organizationId,
          projectId: auditLogs.projectId,
          environmentId: auditLogs.environmentId,
          actionType: auditLogs.actionType,
          entityType: auditLogs.entityType,
          entityId: auditLogs.entityId,
          actorId: auditLogs.actorId,
          actorType: auditLogs.actorType,
          actorEmail: auditLogs.actorEmail,
          actorIp: auditLogs.actorIp,
          userAgent: auditLogs.userAgent,
          requestId: auditLogs.requestId,
          requestMethod: auditLogs.requestMethod,
          requestPath: auditLogs.requestPath,
          source: auditLogs.source,
          description: auditLogs.description,
          changes: auditLogs.changes,
          timestamp: auditLogs.timestamp,
          projectName: projects.name,
          projectSlug: projects.slug,
          environmentName: environments.name,
          environmentSlug: environments.slug,
          actorName: user.name,
          actorImage: user.image,
          flagName: featureFlags.name,
          flagKey: featureFlags.key,
          segmentName: segments.name,
          segmentKey: segments.key,
          tagName: tags.name,
        })
        .from(auditLogs)
        .leftJoin(projects, eq(auditLogs.projectId, projects.id))
        .leftJoin(environments, eq(auditLogs.environmentId, environments.id))
        .leftJoin(user, eq(auditLogs.actorId, user.id))
        .leftJoin(targetingRules, eq(auditLogs.entityId, targetingRules.id))
        .leftJoin(variations, eq(auditLogs.entityId, variations.id))
        .leftJoin(
          featureFlags,
          or(
            eq(auditLogs.entityId, featureFlags.id),
            eq(targetingRules.featureFlagId, featureFlags.id),
            eq(variations.featureFlagId, featureFlags.id),
          ),
        )
        .leftJoin(segments, eq(auditLogs.entityId, segments.id))
        .leftJoin(tags, eq(auditLogs.entityId, tags.id))
        .where(where)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: count() })
        .from(auditLogs)
        .leftJoin(projects, eq(auditLogs.projectId, projects.id))
        .leftJoin(environments, eq(auditLogs.environmentId, environments.id))
        .leftJoin(user, eq(auditLogs.actorId, user.id))
        .leftJoin(targetingRules, eq(auditLogs.entityId, targetingRules.id))
        .leftJoin(variations, eq(auditLogs.entityId, variations.id))
        .leftJoin(
          featureFlags,
          or(
            eq(auditLogs.entityId, featureFlags.id),
            eq(targetingRules.featureFlagId, featureFlags.id),
            eq(variations.featureFlagId, featureFlags.id),
          ),
        )
        .leftJoin(segments, eq(auditLogs.entityId, segments.id))
        .leftJoin(tags, eq(auditLogs.entityId, tags.id))
        .where(where),
    ]);

    return { logs: rows, total: countResult[0]?.count ?? 0, limit, offset };
  }

  async insert(entry: {
    organizationId: string;
    projectId?: string;
    environmentId?: string;
    actionType: string;
    entityType: string;
    entityId: string;
    actorId?: string;
    actorType: string;
    actorEmail?: string;
    actorIp?: string;
    userAgent?: string;
    requestId?: string;
    requestMethod?: string;
    requestPath?: string;
    source?: string;
    description?: string;
    changes: unknown;
  }) {
    const [log] = await this.db
      .insert(auditLogs)
      .values({
        organizationId: entry.organizationId,
        projectId: entry.projectId ?? null,
        environmentId: entry.environmentId ?? null,
        actionType: entry.actionType as any,
        entityType: entry.entityType as any,
        entityId: entry.entityId,
        actorId: entry.actorId ?? null,
        actorType: entry.actorType as 'user' | 'system',
        actorEmail: entry.actorEmail ?? null,
        actorIp: entry.actorIp ?? null,
        userAgent: entry.userAgent ?? null,
        requestId: entry.requestId ? entry.requestId : null,
        requestMethod: entry.requestMethod ?? null,
        requestPath: entry.requestPath ?? null,
        source: (entry.source as any) ?? null,
        description: entry.description ?? null,
        changes: entry.changes,
      })
      .returning();
    return log;
  }
}
