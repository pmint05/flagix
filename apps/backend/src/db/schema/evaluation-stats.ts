import { relations } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  timestamp,
  bigint,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { projects } from './projects';
import { environments } from './environments';
import { featureFlags } from './feature-flags';
import { variations } from './variations';

export const evaluationStatsHourly = pgTable(
  'evaluation_stats_hourly',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id),
    environmentId: uuid('environment_id')
      .notNull()
      .references(() => environments.id),
    featureFlagId: uuid('feature_flag_id')
      .notNull()
      .references(() => featureFlags.id),
    variationId: uuid('variation_id').references(() => variations.id),
    evaluationReason: text('evaluation_reason').notNull(),
    uniqueUsers: bigint('unique_users', { mode: 'number' })
      .notNull()
      .default(0),
    totalCount: bigint('total_count', { mode: 'number' })
      .notNull()
      .default(0),
    bucket: timestamp('bucket', { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex('idx_stats_hourly_unique').on(
      table.organizationId,
      table.featureFlagId,
      table.environmentId,
      table.variationId,
      table.evaluationReason,
      table.bucket,
    ),
    index('idx_stats_hourly_flag_bucket').on(table.featureFlagId, table.bucket),
    index('idx_stats_hourly_org_bucket').on(table.organizationId, table.bucket),
    index('idx_stats_hourly_env_bucket').on(table.environmentId, table.bucket),
  ],
);

export const evaluationStatsHourlyRelations = relations(
  evaluationStatsHourly,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [evaluationStatsHourly.organizationId],
      references: [organizations.id],
    }),
    project: one(projects, {
      fields: [evaluationStatsHourly.projectId],
      references: [projects.id],
    }),
    environment: one(environments, {
      fields: [evaluationStatsHourly.environmentId],
      references: [environments.id],
    }),
    featureFlag: one(featureFlags, {
      fields: [evaluationStatsHourly.featureFlagId],
      references: [featureFlags.id],
    }),
    variation: one(variations, {
      fields: [evaluationStatsHourly.variationId],
      references: [variations.id],
    }),
  }),
);

export const evaluationStatsDaily = pgTable(
  'evaluation_stats_daily',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    featureFlagId: uuid('feature_flag_id').references(() => featureFlags.id),
    environmentId: uuid('environment_id').references(() => environments.id),
    evaluationReason: text('evaluation_reason'),
    uniqueUsers: bigint('unique_users', { mode: 'number' })
      .notNull()
      .default(0),
    totalCount: bigint('total_count', { mode: 'number' })
      .notNull()
      .default(0),
    bucket: timestamp('bucket', { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex('idx_stats_daily_unique').on(
      table.organizationId,
      table.featureFlagId,
      table.environmentId,
      table.evaluationReason,
      table.bucket,
    ),
    index('idx_stats_daily_flag_bucket').on(table.featureFlagId, table.bucket),
    index('idx_stats_daily_org_bucket').on(table.organizationId, table.bucket),
  ],
);

export const evaluationStatsDailyRelations = relations(
  evaluationStatsDaily,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [evaluationStatsDaily.organizationId],
      references: [organizations.id],
    }),
    featureFlag: one(featureFlags, {
      fields: [evaluationStatsDaily.featureFlagId],
      references: [featureFlags.id],
    }),
    environment: one(environments, {
      fields: [evaluationStatsDaily.environmentId],
      references: [environments.id],
    }),
  }),
);
