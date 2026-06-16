import { Inject, Injectable } from '@nestjs/common';
import { eq, and, desc, sql, type SQL } from 'drizzle-orm';
import { auditLogs } from '@/db/schema';
import { DATABASE } from '@/modules/database/database.module';
import { type Database } from '@/db';

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
}

@Injectable()
export class AuditLogsRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async findById(id: string) {
    const [log] = await this.db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.id, id))
      .limit(1);
    return log ?? null;
  }

  async findMany(query: AuditLogQuery) {
    const conditions: SQL[] = [eq(auditLogs.organizationId, query.orgId)];

    if (query.projectId) {
      conditions.push(eq(auditLogs.projectId, query.projectId));
    }
    if (query.environmentId) {
      conditions.push(eq(auditLogs.environmentId, query.environmentId));
    }
    if (query.entityType) {
      conditions.push(eq(auditLogs.entityType, query.entityType as any));
    }
    if (query.actionType) {
      conditions.push(eq(auditLogs.actionType, query.actionType as any));
    }
    if (query.from) {
      conditions.push(sql`${auditLogs.timestamp} >= ${query.from}`);
    }
    if (query.to) {
      conditions.push(sql`${auditLogs.timestamp} <= ${query.to}`);
    }

    const limit = Math.min(query.limit ?? 50, 200);
    const offset = query.offset ?? 0;

    const [logs, countResult] = await Promise.all([
      this.db
        .select()
        .from(auditLogs)
        .where(and(...conditions))
        .orderBy(desc(auditLogs.timestamp))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(auditLogs)
        .where(and(...conditions)),
    ]);

    return { logs, total: countResult[0]?.count ?? 0, limit, offset };
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
        source: entry.source as any ?? null,
        description: entry.description ?? null,
        changes: entry.changes,
      })
      .returning();
    return log;
  }
}
