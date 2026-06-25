import { relations } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  boolean,
  integer,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { featureFlags } from './feature-flags';
import { environments } from './environments';

export const flagStates = pgTable(
  'flag_states',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    featureFlagId: uuid('feature_flag_id')
      .notNull()
      .references(() => featureFlags.id, { onDelete: 'cascade' }),
    environmentId: uuid('environment_id')
      .notNull()
      .references(() => environments.id, { onDelete: 'cascade' }),
    isEnabled: boolean('is_enabled').notNull().default(false),
    status: varchar('status', { length: 20 }).notNull().default('draft'),
    version: integer('version').notNull().default(1),
    createdBy: varchar('created_by', { length: 255 }),
    updatedBy: varchar('updated_by', { length: 255 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    uniqueIndex('idx_flag_states_flag_env').on(
      table.featureFlagId,
      table.environmentId,
    ),
    index('idx_flag_states_env').on(table.environmentId),
    index('idx_flag_states_org').on(table.organizationId),
  ],
);

export const flagStatesRelations = relations(flagStates, ({ one }) => ({
  organization: one(organizations, {
    fields: [flagStates.organizationId],
    references: [organizations.id],
  }),
  featureFlag: one(featureFlags, {
    fields: [flagStates.featureFlagId],
    references: [featureFlags.id],
  }),
  environment: one(environments, {
    fields: [flagStates.environmentId],
    references: [environments.id],
  }),
}));
