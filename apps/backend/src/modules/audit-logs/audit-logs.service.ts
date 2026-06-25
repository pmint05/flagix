import { Injectable, Logger } from '@nestjs/common';
import {
  AuditLogsRepository,
  type AuditLogQuery,
} from './audit-logs.repository';
import { auditContextStorage } from '@/common/audit/audit-context';

export interface AuditLogEntry {
  organizationId: string;
  projectId?: string;
  environmentId?: string;
  actionType: string;
  entityType: string;
  entityId: string;
  actorId?: string;
  actorType?: 'user' | 'system';
  actorEmail?: string;
  actorIp?: string;
  userAgent?: string;
  requestId?: string;
  requestMethod?: string;
  requestPath?: string;
  source?: 'web' | 'api' | 'sdk' | 'system';
  description?: string;
  changes: unknown;
}

export interface RecordChangeOptions<T> {
  organizationId: string;
  projectId?: string;
  environmentId?: string;
  entityType: string;
  entityId: string;
  before: T | null;
  after: T | null;
  resolveAction: (before: T | null, after: T | null) => string;
  sanitize: (entity: T) => unknown;
}

@Injectable()
export class AuditLogsService {
  private readonly logger = new Logger(AuditLogsService.name);

  constructor(private readonly auditRepo: AuditLogsRepository) {}

  async list(query: AuditLogQuery) {
    return this.auditRepo.findMany(query);
  }

  async findOne(orgId: string, logId: string) {
    const log = await this.auditRepo.findById(logId);
    if (!log || log.organizationId !== orgId)
      throw new Error('Audit log entry not found');
    return log;
  }

  async record(entry: AuditLogEntry) {
    const ctx = auditContextStorage.getStore();

    const fullEntry = {
      organizationId: entry.organizationId,
      projectId: entry.projectId,
      environmentId: entry.environmentId,
      actionType: entry.actionType,
      entityType: entry.entityType,
      entityId: entry.entityId,
      actorId: entry.actorId ?? ctx?.actorId,
      actorType: entry.actorType ?? ctx?.actorType ?? 'system',
      actorEmail: entry.actorEmail ?? ctx?.actorEmail,
      actorIp: entry.actorIp ?? ctx?.ip,
      userAgent: entry.userAgent ?? ctx?.userAgent,
      requestId:
        (entry.requestId ?? ctx?.requestId) ? ctx?.requestId : undefined,
      requestMethod: entry.requestMethod ?? ctx?.method,
      requestPath: entry.requestPath ?? ctx?.path,
      source: entry.source ?? ctx?.source,
      description: entry.description,
      changes: entry.changes,
    };

    try {
      return await this.auditRepo.insert(fullEntry);
    } catch (err) {
      this.logger.error({ err, entry: fullEntry }, 'Failed to write audit log');
      return null;
    }
  }

  async recordChange<T>(opts: RecordChangeOptions<T>) {
    const actionType = opts.resolveAction(opts.before, opts.after);
    const sanitizedBefore = opts.before ? opts.sanitize(opts.before) : null;
    const sanitizedAfter = opts.after ? opts.sanitize(opts.after) : null;

    return this.record({
      organizationId: opts.organizationId,
      projectId: opts.projectId,
      environmentId: opts.environmentId,
      actionType,
      entityType: opts.entityType,
      entityId: opts.entityId,
      changes: { before: sanitizedBefore, after: sanitizedAfter },
    });
  }
}
