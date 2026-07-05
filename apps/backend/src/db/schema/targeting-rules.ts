import { relations } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { featureFlags } from './feature-flags';
import { environments } from './environments';
import { variations } from './variations';
import { user } from './auth-schema';

export const targetingRules = pgTable(
  'targeting_rules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    featureFlagId: uuid('feature_flag_id')
      .notNull()
      .references(() => featureFlags.id, { onDelete: 'cascade' }),
    environmentId: uuid('environment_id')
      .notNull()
      .references(() => environments.id, { onDelete: 'cascade' }),
    ruleType: text('rule_type', {
      enum: ['kill_switch', 'user', 'role', 'percentage', 'custom', 'segment'],
    }).notNull(),
    priority: varchar('priority', { length: 255 }).notNull(),
    variationId: uuid('variation_id').references(() => variations.id),
    conditions: jsonb('conditions').notNull(),
    isEnabled: boolean('is_enabled').notNull().default(true),
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
    uniqueIndex('idx_rules_flag_env_priority').on(
      table.featureFlagId,
      table.environmentId,
      table.priority,
    ),
    index('idx_rules_flag').on(table.featureFlagId),
    index('idx_rules_env').on(table.environmentId),
    index('idx_rules_organization').on(table.organizationId),
  ],
);

export const targetingRuleRelations = relations(targetingRules, ({ one }) => ({
  organization: one(organizations, {
    fields: [targetingRules.organizationId],
    references: [organizations.id],
  }),
  featureFlag: one(featureFlags, {
    fields: [targetingRules.featureFlagId],
    references: [featureFlags.id],
  }),
  environment: one(environments, {
    fields: [targetingRules.environmentId],
    references: [environments.id],
  }),
  variation: one(variations, {
    fields: [targetingRules.variationId],
    references: [variations.id],
  }),
}));
