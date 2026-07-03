import { relations } from 'drizzle-orm';
import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
import { user } from './auth-schema';
import { organizations } from './organizations';

export const organizationInvitations = pgTable(
  'organization_invitations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    role: text('role', { enum: ['admin', 'editor', 'viewer'] })
      .notNull()
      .default('viewer'),
    status: text('status', {
      enum: ['pending', 'accepted', 'rejected', 'cancelled'],
    })
      .notNull()
      .default('pending'),
    invitedBy: text('invited_by')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index('idx_invitations_email').on(table.email),
    index('idx_invitations_org').on(table.organizationId),
  ],
);

export const organizationInvitationRelations = relations(
  organizationInvitations,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [organizationInvitations.organizationId],
      references: [organizations.id],
    }),
    sender: one(user, {
      fields: [organizationInvitations.invitedBy],
      references: [user.id],
    }),
  }),
);
