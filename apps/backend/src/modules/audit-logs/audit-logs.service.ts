import { Injectable, NotFoundException } from '@nestjs/common';
import {
  AuditLogsRepository,
  type AuditLogQuery,
} from './audit-logs.repository';

@Injectable()
export class AuditLogsService {
  constructor(private readonly auditRepo: AuditLogsRepository) {}

  async list(query: AuditLogQuery) {
    return this.auditRepo.findMany(query);
  }

  async findOne(orgId: string, logId: string) {
    const log = await this.auditRepo.findById(logId);
    if (!log || log.organizationId !== orgId)
      throw new NotFoundException('Audit log entry not found');
    return log;
  }

  async record(entry: {
    organizationId: string;
    projectId?: string;
    actionType: string;
    entityType: string;
    entityId: string;
    actorId?: string;
    actorType?: string;
    actorEmail?: string;
    changes: unknown;
  }) {
    return this.auditRepo.insert({
      organizationId: entry.organizationId,
      projectId: entry.projectId,
      actionType: entry.actionType,
      entityType: entry.entityType,
      entityId: entry.entityId,
      actorId: entry.actorId,
      actorType: entry.actorType ?? 'user',
      actorEmail: entry.actorEmail,
      changes: entry.changes,
    });
  }
}
