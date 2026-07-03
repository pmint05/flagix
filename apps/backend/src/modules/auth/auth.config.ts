import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { bearer, openAPI } from 'better-auth/plugins';
import { createDrizzleClient } from '@/db';
import { organizations, organizationMembers } from '@/db/schema';
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

              await tx.insert(organizationMembers).values({
                userId: user.id,
                organizationId: org.id,
                role: 'admin',
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
