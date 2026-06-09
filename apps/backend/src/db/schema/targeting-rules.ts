import { relations } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { featureFlags } from './feature-flags';
import { variations } from './variations';

export const targetingRules = pgTable(
  'targeting_rules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    featureFlagId: uuid('feature_flag_id')
      .notNull()
      .references(() => featureFlags.id, { onDelete: 'cascade' }),
    ruleType: text('rule_type', {
      enum: ['kill_switch', 'user', 'role', 'percentage'],
    }).notNull(),
    priority: integer('priority').notNull(),
    variationId: uuid('variation_id')
      .notNull()
      .references(() => variations.id),
    conditions: jsonb('conditions').notNull(),
    isEnabled: boolean('is_enabled').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex('idx_rules_flag_priority').on(
      table.featureFlagId,
      table.priority,
    ),
    index('idx_rules_flag').on(table.featureFlagId),
  ],
);

export const targetingRuleRelations = relations(targetingRules, ({ one }) => ({
  featureFlag: one(featureFlags, {
    fields: [targetingRules.featureFlagId],
    references: [featureFlags.id],
  }),
  variation: one(variations, {
    fields: [targetingRules.variationId],
    references: [variations.id],
  }),
}));
