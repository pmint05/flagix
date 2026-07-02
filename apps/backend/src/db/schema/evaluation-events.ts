import { relations } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  bigint,
  index,
} from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { projects } from './projects';
import { environments } from './environments';
import { featureFlags } from './feature-flags';
import { variations } from './variations';
import { sdkKeys } from './sdk-keys';

export const evaluationEvents = pgTable(
  'evaluation_events',
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
    featureFlagId: uuid('feature_flag_id').references(() => featureFlags.id),
    flagKey: text('flag_key').notNull(),
    variationId: uuid('variation_id').references(() => variations.id),
    variationKey: text('variation_key'),
    resolvedValue: jsonb('resolved_value'),
    evaluationReason: text('evaluation_reason').notNull(),
    contextUserHash: text('context_user_hash'),
    sdkKeyId: uuid('sdk_key_id').references(() => sdkKeys.id),
    clientIpHash: text('client_ip_hash'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('idx_eval_events_org_time').on(table.organizationId, table.createdAt),
    index('idx_eval_events_env_flag_time').on(
      table.environmentId,
      table.flagKey,
      table.createdAt,
    ),
    index('idx_eval_events_flag_time').on(
      table.featureFlagId,
      table.createdAt,
    ),
    index('idx_eval_events_created_at').on(table.createdAt),
  ],
);

export const evaluationEventRelations = relations(
  evaluationEvents,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [evaluationEvents.organizationId],
      references: [organizations.id],
    }),
    project: one(projects, {
      fields: [evaluationEvents.projectId],
      references: [projects.id],
    }),
    environment: one(environments, {
      fields: [evaluationEvents.environmentId],
      references: [environments.id],
    }),
    featureFlag: one(featureFlags, {
      fields: [evaluationEvents.featureFlagId],
      references: [featureFlags.id],
    }),
    variation: one(variations, {
      fields: [evaluationEvents.variationId],
      references: [variations.id],
    }),
    sdkKey: one(sdkKeys, {
      fields: [evaluationEvents.sdkKeyId],
      references: [sdkKeys.id],
    }),
  }),
);
