import { relations, sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { projects } from './projects';
import { flagStates } from './flag-states';
import { sdkKeys } from './sdk-keys';
import { user } from './auth-schema';

export const environments = pgTable(
  'environments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    slug: varchar('slug', { length: 100 }).notNull(),
    type: varchar('type', { length: 50 }).notNull().default('development'),
    isActive: boolean('is_active').notNull().default(true),
    description: text('description'),
    createdBy: text('created_by').references(() => user.id),
    updatedBy: text('updated_by').references(() => user.id),
    deletedBy: text('deleted_by').references(() => user.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    uniqueIndex('idx_environments_project_slug')
      .on(table.projectId, table.slug)
      .where(sql`${table.deletedAt} IS NULL`),
    index('idx_environments_project').on(table.projectId),
    index('idx_environments_org').on(table.organizationId),
  ],
);

export const environmentRelations = relations(
  environments,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [environments.organizationId],
      references: [organizations.id],
    }),
    project: one(projects, {
      fields: [environments.projectId],
      references: [projects.id],
    }),
    flagStates: many(flagStates),
    sdkKeys: many(sdkKeys),
  }),
);
