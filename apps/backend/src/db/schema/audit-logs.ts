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

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    projectId: uuid('project_id').references(() => projects.id),
    actionType: text('action_type', {
      enum: ['create', 'update', 'delete', 'toggle'],
    }).notNull(),
    entityType: text('entity_type', {
      enum: [
        'organization',
        'project',
        'environment',
        'feature_flag',
        'targeting_rule',
        'variation',
      ],
    }).notNull(),
    entityId: uuid('entity_id').notNull(),
    actorId: text('actor_id').references(() => user.id),
    actorType: text('actor_type', { enum: ['user', 'system'] })
      .notNull()
      .default('user'),
    actorEmail: varchar('actor_email', { length: 255 }),
    changes: jsonb('changes').notNull(),
    timestamp: timestamp('timestamp').defaultNow().notNull(),
  },
  (table) => [
    index('idx_audit_org_timestamp').on(table.organizationId, table.timestamp),
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
  actor: one(user, {
    fields: [auditLogs.actorId],
    references: [user.id],
  }),
}));
