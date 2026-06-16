import { relations } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { environments } from './environments';
import { user } from './auth-schema';

export const sdkKeys = pgTable(
  'sdk_keys',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    environmentId: uuid('environment_id')
      .notNull()
      .references(() => environments.id),
    name: varchar('name', { length: 255 }).notNull(),
    keyHash: varchar('key_hash', { length: 255 }).notNull().unique(),
    keyHint: varchar('key_hint', { length: 8 }).notNull(),
    type: text('type', { enum: ['client', 'server'] })
      .notNull()
      .default('client'),
    isActive: boolean('is_active').notNull().default(true),
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
    index('idx_sdk_keys_environment').on(table.environmentId),
    index('idx_sdk_keys_organization').on(table.organizationId),
  ],
);

export const sdkKeyRelations = relations(sdkKeys, ({ one }) => ({
  organization: one(organizations, {
    fields: [sdkKeys.organizationId],
    references: [organizations.id],
  }),
  environment: one(environments, {
    fields: [sdkKeys.environmentId],
    references: [environments.id],
  }),
}));
