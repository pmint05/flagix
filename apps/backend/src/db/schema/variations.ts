import { relations } from 'drizzle-orm';
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
import { featureFlags } from './feature-flags';
import { targetingRules } from './targeting-rules';

export const variations = pgTable(
  'variations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    featureFlagId: uuid('feature_flag_id')
      .notNull()
      .references(() => featureFlags.id, { onDelete: 'cascade' }),
    key: varchar('key', { length: 100 }).notNull(),
    value: jsonb('value').notNull(),
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex('idx_variations_flag_key').on(table.featureFlagId, table.key),
    index('idx_variations_flag').on(table.featureFlagId),
  ],
);

export const variationRelations = relations(variations, ({ one, many }) => ({
  featureFlag: one(featureFlags, {
    fields: [variations.featureFlagId],
    references: [featureFlags.id],
  }),
  targetingRules: many(targetingRules),
}));
