import { relations } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { user } from './auth-schema';
import { organizations } from './organizations';
import { projects } from './projects';
import { environments } from './environments';

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    projectId: uuid('project_id').references(() => projects.id),
    environmentId: uuid('environment_id').references(() => environments.id),
    actionType: text('action_type', {
      enum: [
        'ORG_CREATE',
        'ORG_UPDATE',
        'ORG_DELETE',
        'PROJECT_CREATE',
        'PROJECT_UPDATE',
        'PROJECT_DELETE',
        'ENV_CREATE',
        'ENV_UPDATE',
        'ENV_DELETE',
        'ENV_KEY_ROTATE',
        'FLAG_CREATE',
        'FLAG_UPDATE',
        'FLAG_DELETE',
        'FLAG_ACTIVATE',
        'FLAG_ARCHIVE',
        'FLAG_TOGGLE',
        'RULE_CREATE',
        'RULE_UPDATE',
        'RULE_DELETE',
        'RULE_REORDER',
        'RULE_TOGGLE',
        'VARIATION_CREATE',
        'VARIATION_UPDATE',
        'VARIATION_DELETE',
        'SDK_KEY_CREATE',
        'SDK_KEY_REVOKE',
        'SDK_KEY_ROTATE',
        'MBR_INVITE',
        'MBR_REMOVE',
        'MBR_ROLE_CHANGE',
      ],
    }).notNull(),
    entityType: text('entity_type', {
      enum: [
        'organization',
        'project',
        'environment',
        'feature_flag',
        'targeting_rule',
        'variation',
        'sdk_key',
      ],
    }).notNull(),
    entityId: uuid('entity_id').notNull(),
    actorId: text('actor_id').references(() => user.id),
    actorType: text('actor_type', { enum: ['user', 'system'] })
      .notNull()
      .default('user'),
    actorEmail: varchar('actor_email', { length: 255 }),
    actorIp: varchar('actor_ip', { length: 45 }),
    userAgent: text('user_agent'),
    requestId: uuid('request_id'),
    requestMethod: varchar('request_method', { length: 10 }),
    requestPath: text('request_path'),
    source: text('source', { enum: ['web', 'api', 'sdk', 'system'] }),
    description: text('description'),
    changes: jsonb('changes').notNull(),
    timestamp: timestamp('timestamp').defaultNow().notNull(),
  },
  (table) => [
    index('idx_audit_org_timestamp').on(table.organizationId, table.timestamp),
    index('idx_audit_project_timestamp').on(table.projectId, table.timestamp),
    index('idx_audit_entity').on(table.entityType, table.entityId),
    index('idx_audit_actor').on(table.actorId),
  ],
);

export const auditLogRelations = relations(auditLogs, ({ one }) => ({
  organization: one(organizations, {
    fields: [auditLogs.organizationId],
    references: [organizations.id],
  }),
  project: one(projects, {
    fields: [auditLogs.projectId],
    references: [projects.id],
  }),
  environment: one(environments, {
    fields: [auditLogs.environmentId],
    references: [environments.id],
  }),
  actor: one(user, {
    fields: [auditLogs.actorId],
    references: [user.id],
  }),
}));
