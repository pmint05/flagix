import { relations, sql } from 'drizzle-orm';
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
import { targetingRules } from './targeting-rules';

export const variations = pgTable(
  'variations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    featureFlagId: uuid('feature_flag_id')
      .notNull()
      .references(() => featureFlags.id, { onDelete: 'cascade' }),
    key: varchar('key', { length: 100 }).notNull(),
    value: jsonb('value').notNull(),
    description: text('description'),
    color: varchar('color', { length: 50 }),
    isDefault: boolean('is_default').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    uniqueIndex('idx_variations_flag_key')
      .on(table.featureFlagId, table.key)
      .where(sql`${table.deletedAt} IS NULL`),
    index('idx_variations_flag').on(table.featureFlagId),
    index('idx_variations_organization').on(table.organizationId),
    uniqueIndex('idx_variations_default')
      .on(table.featureFlagId)
      .where(sql`${table.isDefault} = true`),
  ],
);

export const variationRelations = relations(variations, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [variations.organizationId],
    references: [organizations.id],
  }),
  featureFlag: one(featureFlags, {
    fields: [variations.featureFlagId],
    references: [featureFlags.id],
  }),
  targetingRules: many(targetingRules),
}));
