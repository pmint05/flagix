import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { bearer, openAPI } from 'better-auth/plugins';
import { createDrizzleClient } from '@/db';
import {
  organizations,
  organizationMembers,
  projects,
  environments,
  auditLogs,
} from '@/db/schema';
import { slugify } from '@/common/utils/slug';

const db = createDrizzleClient();

export const auth = betterAuth({
  basePath: '/api/auth',
  plugins: [
    openAPI({
      disableDefaultReference: process.env.NODE_ENV === 'production',
    }),
    bearer(),
  ],
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  user: {
    additionalFields: {},
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            const orgName = `${user.name || 'User'}'s Organization`;
            const baseSlug = slugify(user.name || 'user');
            const uniqueSlug = `${baseSlug || 'user'}-${user.id.slice(0, 8)}`;

            await db.transaction(async (tx) => {
              const [org] = await tx
                .insert(organizations)
                .values({
                  name: orgName,
                  slug: uniqueSlug,
                })
                .returning();

              const [member] = await tx
                .insert(organizationMembers)
                .values({
                  userId: user.id,
                  organizationId: org.id,
                  role: 'admin',
                })
                .returning();

              await tx.insert(auditLogs).values({
                organizationId: org.id,
                actionType: 'ORG_CREATE',
                entityType: 'organization',
                entityId: org.id,
                actorId: user.id,
                actorType: 'user',
                actorEmail: user.email,
                changes: { before: null, after: org },
                timestamp: new Date(),
              });

              await tx.insert(auditLogs).values({
                organizationId: org.id,
                actionType: 'MBR_INVITE',
                entityType: 'organization_member',
                entityId: member.id,
                actorId: user.id,
                actorType: 'user',
                actorEmail: user.email,
                changes: {
                  before: null,
                  after: { userId: user.id, role: 'admin' },
                },
                timestamp: new Date(),
              });

              const defaultProjectSlug = 'default';

              const [project] = await tx
                .insert(projects)
                .values({
                  organizationId: org.id,
                  name: 'Default Project',
                  slug: defaultProjectSlug,
                })
                .returning();

              const [env] = await tx
                .insert(environments)
                .values({
                  organizationId: org.id,
                  projectId: project.id,
                  name: 'Production',
                  slug: 'production',
                })
                .returning();

              await tx.insert(auditLogs).values({
                organizationId: org.id,
                projectId: project.id,
                actionType: 'PROJECT_CREATE',
                entityType: 'project',
                entityId: project.id,
                actorId: user.id,
                actorType: 'user',
                actorEmail: user.email,
                changes: { before: null, after: project },
                timestamp: new Date(),
              });

              await tx.insert(auditLogs).values({
                organizationId: org.id,
                projectId: project.id,
                environmentId: env.id,
                actionType: 'ENV_CREATE',
                entityType: 'environment',
                entityId: env.id,
                actorId: user.id,
                actorType: 'user',
                actorEmail: user.email,
                changes: { before: null, after: env },
                timestamp: new Date(),
              });
            });
          } catch (error) {
            console.error(
              `Failed to create default organization for user ${user.id}:`,
              error,
            );
          }
        },
      },
    },
  },
  advanced: {
    cookiePrefix: 'flagix',
    ipAddress: {
      ipAddressHeaders: ['x-forwarded-for', 'x-real-ip', 'cf-connecting-ip'],
      disableIpTracking: false,
    },
  },
  baseURL: process.env.BETTER_AUTH_URL
    ? process.env.BETTER_AUTH_URL
    : 'http://localhost:9000',
  trustedOrigins: [
    process.env.BETTER_AUTH_URL ?? 'http://localhost:9000',
    'http://localhost:5173',
    'http://localhost:3001',
    'http://localhost:3000',
  ],
});

export type Auth = typeof auth;
