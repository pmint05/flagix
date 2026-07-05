import { relations, sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { projects } from './projects';
import { user } from './auth-schema';

export const segments = pgTable(
  'segments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    key: varchar('key', { length: 255 }).notNull(),
    description: text('description'),
    conditions: jsonb('conditions').notNull(),
    createdBy: text('created_by').references(() => user.id),
    updatedBy: text('updated_by').references(() => user.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    uniqueIndex('idx_segments_project_key')
      .on(table.projectId, table.key)
      .where(sql`${table.deletedAt} IS NULL`),
    index('idx_segments_project').on(table.projectId),
    index('idx_segments_organization').on(table.organizationId),
  ],
);

export const segmentsRelations = relations(segments, ({ one }) => ({
  organization: one(organizations, {
    fields: [segments.organizationId],
    references: [organizations.id],
  }),
  project: one(projects, {
    fields: [segments.projectId],
    references: [projects.id],
  }),
  creator: one(user, {
    fields: [segments.createdBy],
    references: [user.id],
  }),
}));
