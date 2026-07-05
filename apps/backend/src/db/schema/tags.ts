import { relations } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  index,
  uniqueIndex,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { projects } from './projects';
import { featureFlags } from './feature-flags';

export const tags = pgTable(
  'tags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex('idx_tags_project_name').on(table.projectId, table.name),
    index('idx_tags_project').on(table.projectId),
    index('idx_tags_organization').on(table.organizationId),
  ],
);

export const tagsRelations = relations(tags, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [tags.organizationId],
    references: [organizations.id],
  }),
  project: one(projects, {
    fields: [tags.projectId],
    references: [projects.id],
  }),
  featureFlagsToTags: many(featureFlagsToTags),
}));

export const featureFlagsToTags = pgTable(
  'feature_flags_to_tags',
  {
    featureFlagId: uuid('feature_flag_id')
      .notNull()
      .references(() => featureFlags.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.featureFlagId, table.tagId] }),
  ],
);

export const featureFlagsToTagsRelations = relations(
  featureFlagsToTags,
  ({ one }) => ({
    featureFlag: one(featureFlags, {
      fields: [featureFlagsToTags.featureFlagId],
      references: [featureFlags.id],
    }),
    tag: one(tags, {
      fields: [featureFlagsToTags.tagId],
      references: [tags.id],
    }),
  }),
);
