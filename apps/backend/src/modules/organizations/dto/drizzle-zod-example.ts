/**
 * Drizzle-Zod Integration Example
 *
 * This file demonstrates how to derive Zod schemas directly from Drizzle table
 * definitions using `drizzle-zod`. This pattern ensures type safety between
 * your database schema and validation layers.
 *
 * Usage:
 *   - `insertOrganizationSchema` — validates data for INSERT operations
 *   - `selectOrganizationSchema` — validates data returned from SELECT queries
 *   - `updateOrganizationSchema` — validates data for UPDATE operations (all fields optional)
 *
 * For future modules, prefer this pattern over manually defining Zod schemas
 * that mirror Drizzle table definitions. It eliminates duplication and keeps
 * schemas in sync automatically.
 */
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { organizations } from '@/db/schema/organizations';

export const insertOrganizationSchema = createInsertSchema(organizations, {
  name: (schema) => schema.min(1).max(255),
  slug: (schema) =>
    schema
      .min(1)
      .max(100)
      .regex(/^[a-z0-9-]+$/),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export const selectOrganizationSchema = createSelectSchema(organizations);

export const updateOrganizationSchema = insertOrganizationSchema.partial();
