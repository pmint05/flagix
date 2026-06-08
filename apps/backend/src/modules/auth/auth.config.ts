import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { openAPI } from 'better-auth/plugins';
import { createDrizzleClient } from '../../db';

const db = createDrizzleClient();

export const auth = betterAuth({
  basePath: '/api/auth',
  plugins: [
    openAPI({
      disableDefaultReference: process.env.NODE_ENV === 'production',
    }),
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
  ],
});

export type Auth = typeof auth;
