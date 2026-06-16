import { relations } from 'drizzle-orm';
import { user, session, account } from './auth-schema';
import { organizationMembers } from './organization-members';
import { auditLogs } from './audit-logs';

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  organizationMembers: many(organizationMembers),
  auditLogs: many(auditLogs),
}));
