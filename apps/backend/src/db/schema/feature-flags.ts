import { relations } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { environments } from './environments';
import { variations } from './variations';
import { targetingRules } from './targeting-rules';

export const featureFlags = pgTable(
  'feature_flags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    environmentId: uuid('environment_id')
      .notNull()
      .references(() => environments.id, { onDelete: 'cascade' }),
    key: varchar('key', { length: 255 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    flagType: text('flag_type', { enum: ['boolean', 'multivariate'] })
      .notNull()
      .default('boolean'),
    status: text('status', { enum: ['draft', 'active', 'archived'] })
      .notNull()
      .default('draft'),
    isEnabled: boolean('is_enabled').notNull().default(false),
    defaultVariationId: uuid('default_variation_id'),
    version: integer('version').notNull().default(1),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex('idx_flags_env_key').on(table.environmentId, table.key),
    index('idx_flags_environment').on(table.environmentId),
    index('idx_flags_status').on(table.status),
  ],
);

export const featureFlagRelations = relations(
  featureFlags,
  ({ one, many }) => ({
    environment: one(environments, {
      fields: [featureFlags.environmentId],
      references: [environments.id],
    }),
    variations: many(variations),
    targetingRules: many(targetingRules),
    defaultVariation: one(variations, {
      fields: [featureFlags.defaultVariationId],
      references: [variations.id],
    }),
  }),
);
