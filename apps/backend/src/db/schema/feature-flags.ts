import { relations } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { projects } from './projects';
import { flagStates } from './flag-states';
import { variations } from './variations';
import { targetingRules } from './targeting-rules';
import { user } from './auth-schema';

export const featureFlags = pgTable(
  'feature_flags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    key: varchar('key', { length: 255 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    flagType: text('flag_type', { enum: ['boolean', 'multivariate'] })
      .notNull()
      .default('boolean'),
    version: integer('version').notNull().default(1),
    createdBy: text('created_by').references(() => user.id),
    updatedBy: text('updated_by').references(() => user.id),
    deletedBy: text('deleted_by').references(() => user.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp('deleted_at'),
    visibility: text('visibility', {
      enum: ['all', 'client_only', 'server_only'],
    })
      .notNull()
      .default('all'),
    isTemporary: boolean('is_temporary').notNull().default(false),
  },
  (table) => [
    uniqueIndex('idx_flags_project_key').on(table.projectId, table.key),
    index('idx_flags_org').on(table.organizationId),
    index('idx_flags_project').on(table.projectId),
  ],
);

export const featureFlagRelations = relations(
  featureFlags,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [featureFlags.organizationId],
      references: [organizations.id],
    }),
    project: one(projects, {
      fields: [featureFlags.projectId],
      references: [projects.id],
    }),
    flagStates: many(flagStates),
    variations: many(variations),
    targetingRules: many(targetingRules),
  }),
);
