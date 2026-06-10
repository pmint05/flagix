import { relations } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { projects } from './projects';
import { featureFlags } from './feature-flags';
import { sdkKeys } from './sdk-keys';

export const environments = pgTable(
  'environments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    slug: varchar('slug', { length: 100 }).notNull(),
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    uniqueIndex('idx_environments_project_slug').on(
      table.projectId,
      table.slug,
    ),
    index('idx_environments_project').on(table.projectId),
  ],
);

export const environmentRelations = relations(
  environments,
  ({ one, many }) => ({
    project: one(projects, {
      fields: [environments.projectId],
      references: [projects.id],
    }),
    featureFlags: many(featureFlags),
    sdkKeys: many(sdkKeys),
  }),
);
