---
description: "Task list for Backend-only implementation of Feature Flag Platform"
---

# Tasks: Feature Flag Platform — Backend & Shared Types Only

**Input**: Design documents from `/specs/001-feature-flag-platform/`

**Prerequisites**: plan.md (required), spec.md (required), data-model.md, contracts/management-api.md, contracts/evaluation-api.md, research.md

**Scope**: This task list intentionally EXCLUDES all work related to:
- `apps/frontend` (Dashboard — TanStack Router, shadcn/ui, HeroUI)
- `apps/demo` (Next.js demo app)
- `packages/sdk-core`, `packages/sdk-react`, `packages/utils`
- Frontend SDK implementation, SSE client subscription logic
- Dashboard RBAC UI, project/flag creation UI, audit log UI

**Focus**: 100% Backend (`apps/backend`) + Shared Types (`packages/shared`)

**Tests**: OPTIONAL — included where explicitly required by the spec (evaluation engine, kill switch determinism). Contract tests for the API surface are included to validate request/response shape.

**Organization**: Tasks are grouped by the 4 backend phases defined in the user input. Frontend user stories from spec.md are intentionally collapsed into backend endpoints (e.g., US1 Multi-Tenant → Organization/Project CRUD; US6 RBAC → `@OrgRoles` guard).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Maps task to backend user story for traceability
- Include exact file paths in descriptions

---

## Phase 1: Infrastructure & Better Auth Setup (Nền móng)

**Purpose**: Establish the runtime foundation — Drizzle connection, Better Auth configuration, and auto-generated auth schema. Nothing else can be built without these.

**Independent Test**: `pnpm --filter backend db:push` succeeds against the Docker PostgreSQL; `npx @better-auth/cli generate` produces a non-empty `auth-schema.ts`; `pnpm --filter backend start:dev` boots without errors.

- [X] T001 Install backend dependencies: `drizzle-orm@^0.45.2`, `pg@^8.13.0`, `drizzle-kit@^0.31.10` (dev), `better-auth@latest`, `@thallesp/nestjs-better-auth@latest`, `imurmurhash@^0.1.4` in `apps/backend/package.json`
- [X] T002 Add shared package Zod dependency: `zod@^3.23.0` to `packages/shared/package.json`; add `@flagix/shared` as `workspace:*` dependency in `apps/backend/package.json`
- [X] T003 [P] Create `apps/backend/.env` with `DATABASE_URL=postgresql://flagix:flagix@localhost:5432/flagix`, `BETTER_AUTH_SECRET=<32-char-random>`, `BETTER_AUTH_URL=http://localhost:3000`, `PORT=3000`; add `apps/backend/.env.example` mirroring the keys
- [X] T004 [P] Create `apps/backend/drizzle.config.ts` pointing at `src/db/schema.ts` and `src/db/auth-schema.ts` with `dialect: 'postgresql'` and the `DATABASE_URL` from env
- [X] T005 [P] Create `apps/backend/src/db/index.ts` exporting a NestJS-ready Drizzle client factory: read `process.env.DATABASE_URL`, create a `pg` `Pool`, return `drizzle(pool, { schema })`
- [X] T006 Create `apps/backend/src/modules/database/database.module.ts` as a `@Global()` module that provides the Drizzle client via `{ provide: 'DATABASE', useFactory: () => createDrizzleClient() }` and exports it
- [X] T007 [P] Create Better Auth config at `apps/backend/src/modules/auth/auth.config.ts`: define `betterAuth({ database: drizzleAdapter(...), emailAndPassword: { enabled: true, autoSignIn: true }, session: { expiresIn: 60*60*24*7, updateAge: 60*60*24 }, user: { additionalFields: {} }, databaseHooks: { user: { create: { after: async (user) => { /* create default org + ADMIN membership */ } } } } })`
- [X] T008 Create `apps/backend/src/modules/auth/auth.module.ts` importing `AuthModule.forRoot({ auth: authConfig })` from `@thallesp/nestjs-better-auth`; re-export the `Auth`, `Session`, `AllowAnonymous`, `OrgRoles` symbols from the adapter
- [X] T009 Run Better Auth CLI `npx @better-auth/cli@latest generate --config apps/backend/src/modules/auth/auth.config.ts --output apps/backend/src/db/auth-schema.ts` to auto-generate `user`, `session`, `account`, `verification` Drizzle table definitions; commit the generated file as-is
- [X] T010 Create empty platform schema file `apps/backend/src/db/schema.ts` exporting an empty `export const platformTables = {}` placeholder (will be filled in Phase 2); verify `drizzle-kit generate` runs without errors against the empty file
- [X] T011 Update `apps/backend/src/main.ts` to: (1) call `NestFactory.create(AppModule, { bodyParser: false })`, (2) install `bodyParser` middleware globally for non-auth routes via a custom middleware, (3) call `app.listen(process.env.PORT ?? 3000)`
- [X] T012 Update `apps/backend/src/app.module.ts` to import `ConfigModule.forRoot({ isGlobal: true })`, `DatabaseModule`, and `AuthModule`; remove the legacy `UsersModule` import

**Checkpoint**: Phase 1 complete — backend boots, Drizzle connects to Postgres, Better Auth auth-schema.ts exists, `bodyParser: false` is configured globally.

---

## Phase 2: Domain Schema & Authentication Guard

**Purpose**: Define all platform-specific Drizzle tables with proper foreign keys to Better Auth `user.id`, and wire up the global authentication guard so that protected routes reject unauthenticated requests.

**Independent Test**: `pnpm --filter backend db:push` creates all 8 platform tables; `POST /api/v1/projects` (or any protected route stub) returns 401 without a session cookie and 200 with a valid session cookie.

### Phase 2.1: Platform Drizzle Schema

- [ ] T013 [P] Define `organizations` table in `apps/backend/src/db/schema.ts` with columns: `id uuid PK defaultRandom()`, `name varchar(255) NOT NULL`, `slug varchar(100) NOT NULL UNIQUE`, `createdAt timestamp defaultNow()`, `updatedAt timestamp defaultNow()`; export as `organizations`
- [ ] T014 [P] Define `organizationMembers` table with FK `userId: text NOT NULL REFERENCES authUser.id ON DELETE CASCADE`, `organizationId: uuid NOT NULL REFERENCES organizations.id ON DELETE CASCADE`, `role: text NOT NULL DEFAULT 'viewer'` constrained to enum, UNIQUE(userId, organizationId); export as `organizationMembers`
- [ ] T015 [P] Define `projects` table with `organizationId uuid NOT NULL REFERENCES organizations.id ON DELETE CASCADE`, `name varchar(255) NOT NULL`, `slug varchar(100) NOT NULL`, `description text`, UNIQUE(organizationId, slug); export as `projects`
- [ ] T016 [P] Define `environments` table with `projectId uuid NOT NULL REFERENCES projects.id ON DELETE CASCADE`, `name varchar(100) NOT NULL`, `slug varchar(100) NOT NULL`, `description text`, `sdkKey varchar(255) NOT NULL UNIQUE`, UNIQUE(projectId, slug); export as `environments`
- [ ] T017 [P] Define `featureFlags` table with `environmentId uuid NOT NULL REFERENCES environments.id ON DELETE CASCADE`, `key varchar(255) NOT NULL`, `name varchar(255) NOT NULL`, `description text`, `flagType text NOT NULL DEFAULT 'boolean'`, `status text NOT NULL DEFAULT 'draft'`, `isEnabled boolean NOT NULL DEFAULT false`, `defaultVariationId uuid`, `version integer NOT NULL DEFAULT 1`, UNIQUE(environmentId, key); export as `featureFlags`
- [ ] T018 [P] Define `variations` table with `featureFlagId uuid NOT NULL REFERENCES featureFlags.id ON DELETE CASCADE`, `key varchar(100) NOT NULL`, `value jsonb NOT NULL`, `description text`, UNIQUE(featureFlagId, key); export as `variations`
- [ ] T019 [P] Define `targetingRules` table with `featureFlagId uuid NOT NULL REFERENCES featureFlags.id ON DELETE CASCADE`, `ruleType text NOT NULL`, `priority integer NOT NULL`, `variationId uuid NOT NULL REFERENCES variations.id`, `conditions jsonb NOT NULL`, `isEnabled boolean NOT NULL DEFAULT true`, UNIQUE(featureFlagId, priority); export as `targetingRules`
- [ ] T020 [P] Define `auditLogs` table with `organizationId uuid NOT NULL REFERENCES organizations.id`, `projectId uuid REFERENCES projects.id`, `actionType text NOT NULL`, `entityType text NOT NULL`, `entityId uuid NOT NULL`, `actorId text REFERENCES authUser.id` (nullable for system actions), `actorType text NOT NULL DEFAULT 'user'`, `actorEmail varchar(255)`, `changes jsonb NOT NULL`, `timestamp timestamp NOT NULL DEFAULT now()`; add composite indexes on (organizationId, timestamp) and (entityType, entityId) and (actorId); export as `auditLogs`
- [ ] T021 Create `apps/backend/src/db/schema.ts` barrel re-export combining all tables and re-exporting `auth-schema.ts` tables (`authUser`, `authSession`, `authAccount`, `authVerification`) for FK reference; ensure `drizzle()` is initialized with the full schema object

### Phase 2.2: Authentication & RBAC Guards

- [ ] T022 Create `apps/backend/src/common/decorators/current-user.decorator.ts` parameter decorator `@CurrentUser()` extending the `@thallesp/nestjs-better-auth` `@Session()` decorator to return the typed `User` object (or extract from `session.user`)
- [ ] T023 Create `apps/backend/src/common/guards/org-roles.guard.ts` implementing `CanActivate`: reads `@OrgRoles(...)` metadata and `req.params.organizationId` (or header), queries `organizationMembers` for the caller's userId + organizationId, compares role; throws `ForbiddenException` on mismatch
- [ ] T024 Create `apps/backend/src/common/guards/org-member.guard.ts` implementing `CanActivate`: verifies the authenticated user is a member of the org derived from the route (orgId from path/body); throws `ForbiddenException` if not
- [ ] T025 Create `apps/backend/src/common/decorators/org-roles.decorator.ts` exporting `@OrgRoles('admin' | 'editor' | 'viewer', { orgIdParam?: string })` (re-export + extension of the adapter's decorator to support custom orgId resolution)
- [ ] T026 Wire global `AuthGuard` (from `@thallesp/nestjs-better-auth`) in `apps/backend/src/app.module.ts` via `APP_GUARD` provider so all routes are protected by default; evaluation routes will be exempted with `@AllowAnonymous()` in Phase 4
- [ ] T027 Create stub controllers `apps/backend/src/modules/organizations/organizations.controller.ts` and `apps/backend/src/modules/projects/projects.controller.ts` with a single `GET /api/v1/projects` endpoint decorated with `@UseGuards(OrgMemberGuard)` to validate the guard wiring end-to-end (will be filled in Phase 3)
- [ ] T028 Run `pnpm --filter backend drizzle-kit generate` to create the initial migration file `apps/backend/src/db/migrations/0000_init.sql`; run `pnpm --filter backend drizzle-kit migrate` to apply; verify with `psql` that all 12 tables (4 auth + 8 platform) exist
- [ ] T029 Add npm script `db:push` (uses `drizzle-kit push`) and `db:migrate` (uses `drizzle-kit migrate`) to `apps/backend/package.json`; document in a comment in `drizzle.config.ts`

**Checkpoint**: Phase 2 complete — all platform tables exist with proper FKs to Better Auth `user.id`; AuthGuard + OrgRolesGuard reject unauthorized requests.

---

## Phase 3: Management APIs & Shared Types (Nghiệp vụ)

**Purpose**: Define shared Zod schemas in `packages/shared` as the single source of truth, then implement CRUD REST APIs for organizations, projects, environments, feature flags, targeting rules, and audit logs.

**Independent Test**: For each resource: a happy-path POST returns 201, GET returns 200 with the resource, PATCH returns 200, DELETE returns 200; cross-tenant access returns 404; missing role returns 403; contract test snapshot matches the management-api.md spec.

### Phase 3.1: Shared Zod Schemas (packages/shared)

- [ ] T030 [P] Create `packages/shared/src/schemas/enums.ts` with Zod enums: `flagTypeEnum = z.enum(['boolean', 'multivariate'])`, `flagStatusEnum = z.enum(['draft', 'active', 'archived'])`, `ruleTypeEnum = z.enum(['kill_switch', 'user', 'role', 'percentage'])`, `memberRoleEnum = z.enum(['admin', 'editor', 'viewer'])`, `actionTypeEnum = z.enum(['create', 'update', 'delete', 'toggle'])`, `entityTypeEnum = z.enum(['organization', 'project', 'environment', 'feature_flag', 'targeting_rule', 'variation'])`, `actorTypeEnum = z.enum(['user', 'system'])`
- [ ] T031 [P] Create `packages/shared/src/schemas/evaluation-context.ts` with `evaluationContextSchema = z.object({ userId: z.string().optional(), role: z.string().optional(), attributes: z.record(z.union([z.string(), z.number(), z.boolean()])).optional() })` and export the inferred `EvaluationContext` type
- [ ] T032 [P] Create `packages/shared/src/schemas/rule-conditions.ts` with a discriminated union: `killSwitchConditionsSchema = z.object({})`, `userConditionsSchema = z.object({ userIds: z.array(z.string().min(1)).min(1) })`, `roleConditionsSchema = z.object({ roles: z.array(z.string().min(1)).min(1) })`, `percentageConditionsSchema = z.object({ percentage: z.number().int().min(0).max(100) })`; combine into `ruleConditionsSchema` (discriminated by ruleType)
- [ ] T033 [P] Create `packages/shared/src/schemas/variation.ts` with `variationValueSchema = z.union([z.boolean(), z.string(), z.record(z.unknown())])` and `variationInputSchema = z.object({ key: z.string().min(1).max(100), value: variationValueSchema, description: z.string().optional() })`
- [ ] T034 [P] Create `packages/shared/src/schemas/feature-flag.ts` with `createFeatureFlagSchema = z.object({ key: z.string().regex(/^[a-zA-Z0-9_-]+$/).min(1).max(255), name: z.string().min(1).max(255), description: z.string().optional(), flagType: flagTypeEnum, variations: z.array(variationInputSchema).optional(), defaultVariationKey: z.string().min(1) })`; `updateFeatureFlagSchema = createFeatureFlagSchema.partial().extend({ version: z.number().int().positive() })`
- [ ] T035 [P] Create `packages/shared/src/schemas/targeting-rule.ts` with `createTargetingRuleSchema = z.discriminatedUnion('ruleType', [...])` combining the four condition schemas; add `isEnabled: z.boolean().optional()` field
- [ ] T036 [P] Create `packages/shared/src/schemas/organization.ts`, `project.ts`, `environment.ts` with corresponding create/update Zod schemas (name length 1-255, slug pattern `^[a-z0-9-]+$`, etc.) and exported types
- [ ] T037 [P] Create `packages/shared/src/schemas/evaluation-result.ts` with `evaluationResultSchema = z.object({ flagKey: z.string(), enabled: z.boolean(), variationKey: z.string(), resolvedValue: variationValueSchema, evaluationReason: z.enum(['KILL_SWITCH', 'USER_TARGETING', 'ROLE_TARGETING', 'PERCENTAGE_ROLLOUT', 'DEFAULT', 'FLAG_NOT_FOUND', 'FLAG_ARCHIVED', 'FLAG_DRAFT', 'FLAG_DISABLED', 'EVALUATION_ERROR']) })`; export `EvaluationResult` type
- [ ] T038 [P] Create `packages/shared/src/constants/roles.ts` exporting `ROLE_HIERARCHY = { viewer: 0, editor: 1, admin: 2 } as const` and `hasAtLeastRole(actual: MemberRole, required: MemberRole): boolean` helper
- [ ] T039 [P] Create `packages/shared/src/constants/reasons.ts` exporting `EVALUATION_REASONS` const tuple and `EvaluationReason` type (mirrors the Zod enum from T037)
- [ ] T040 Update `packages/shared/src/index.ts` to re-export everything from `schemas/`, `constants/`, plus `types/` (add type-only re-exports for `Organization`, `Project`, `Environment`, `FeatureFlag`, `Variation`, `TargetingRule`, `AuditLog` derived from the Zod schemas)

### Phase 3.2: Organizations Module

- [ ] T041 Create `apps/backend/src/modules/organizations/dto/create-organization.dto.ts` (class-validator) with `@IsString @Length(1,255) name`, `@IsString @Matches(/^[a-z0-9-]+$/) @Length(1,100) slug`; same shape as `packages/shared` Zod schema
- [ ] T042 Create `apps/backend/src/modules/organizations/organizations.repository.ts` with methods: `findById(id)`, `findBySlug(slug)`, `findAllForUser(userId)`, `create(input)`, `update(id, input)`, `delete(id)` — all using injected `DATABASE` token, returning Drizzle inferred types
- [ ] T043 Create `apps/backend/src/modules/organizations/organizations.service.ts` with `create(input, actor)`, `findOneForUser(id, userId)` (verifies membership), `findAllForUser(userId)`, `update(id, input, actor)`, `remove(id, actor)` — calls repository and writes audit logs
- [ ] T044 Create `apps/backend/src/modules/organizations/organizations.controller.ts` with `POST /api/v1/organizations`, `GET /api/v1/organizations`, `GET /api/v1/organizations/:organizationId`, `PATCH /api/v1/organizations/:organizationId` (`@OrgRoles('admin')`), `DELETE /api/v1/organizations/:organizationId` (`@OrgRoles('admin')`); use `@CurrentUser()` to get the actor
- [ ] T045 Create `apps/backend/src/modules/organizations/organizations.module.ts` wiring controller, service, repository; export service for downstream modules

### Phase 3.3: Projects Module

- [ ] T046 [P] Create `apps/backend/src/modules/projects/dto/create-project.dto.ts` and `update-project.dto.ts` (class-validator) mirroring shared Zod schemas
- [ ] T047 Create `apps/backend/src/modules/projects/projects.repository.ts` with `findById(id)`, `findAllForOrg(orgId)`, `create(input)`, `update(id, input)`, `delete(id)`
- [ ] T048 Create `apps/backend/src/modules/projects/projects.service.ts` with `create(orgId, input, actor)`, `findAll(orgId)`, `findOne(projectId, userId)` (membership check), `update(projectId, input, actor)`, `remove(projectId, actor)`
- [ ] T049 Create `apps/backend/src/modules/projects/projects.controller.ts` with `POST /api/v1/projects`, `GET /api/v1/projects`, `GET /api/v1/projects/:projectId`, `PATCH /api/v1/projects/:projectId` (`@OrgRoles('admin','editor')`), `DELETE /api/v1/projects/:projectId` (`@OrgRoles('admin')`)
- [ ] T050 Create `apps/backend/src/modules/projects/projects.module.ts`

### Phase 3.4: Environments Module

- [ ] T051 [P] Create `apps/backend/src/modules/environments/dto/*.dto.ts` files
- [ ] T052 Create `apps/backend/src/modules/environments/environments.repository.ts` with `findById`, `findAllForProject`, `create` (auto-generates `sdkKey` via `crypto.randomBytes(32).toString('hex')`), `delete`
- [ ] T053 Create `apps/backend/src/modules/environments/environments.service.ts` ensuring `sdkKey` is stripped from all responses except the create endpoint
- [ ] T054 Create `apps/backend/src/modules/environments/environments.controller.ts` with CRUD endpoints nested under `/api/v1/projects/:projectId/environments`
- [ ] T055 Create `apps/backend/src/modules/environments/environments.module.ts`

### Phase 3.5: Feature Flags Module

- [ ] T056 [P] Create `apps/backend/src/modules/feature-flags/dto/create-feature-flag.dto.ts` with nested `variations` array validated against the shared Zod schema (use `zodValidationPipe`); same for `update-feature-flag.dto.ts` with `version` required
- [ ] T057 Create `apps/backend/src/modules/feature-flags/feature-flags.repository.ts` with `findById`, `findByKey(envId, key)`, `findAllForEnv(envId, statusFilter?)`, `create` (with nested variations in a transaction), `update` (with optimistic version check), `delete`
- [ ] T058 Create `apps/backend/src/modules/feature-flags/feature-flags.service.ts` with: auto-creating `true`/`false` variations when `flagType='boolean'` and no variations provided; resolving `defaultVariationKey` → `defaultVariationId` after variation insert; validating status transitions (`draft → active → archived`, no backward); incrementing `version` on every update
- [ ] T059 Create `apps/backend/src/modules/feature-flags/feature-flags.controller.ts` with CRUD nested under `/api/v1/projects/:projectId/environments/:envId/flags`; DELETE decorated with `@OrgRoles('admin')` (only ADMIN can delete flags per FR-042)
- [ ] T060 Create `apps/backend/src/modules/feature-flags/feature-flags.module.ts`

### Phase 3.6: Targeting Rules Module

- [ ] T061 [P] Create `apps/backend/src/modules/targeting-rules/dto/create-targeting-rule.dto.ts` using the shared discriminated union Zod schema; pipe the body through `ZodValidationPipe`
- [ ] T062 Create `apps/backend/src/modules/targeting-rules/targeting-rules.repository.ts` with `findById`, `findAllForFlag`, `create` (auto-assigning `priority` based on `ruleType`: kill_switch=0, user=100+row, role=200+row, percentage=300+row, where `row` is the next available integer in that bucket), `update`, `delete`
- [ ] T063 Create `apps/backend/src/modules/targeting-rules/targeting-rules.service.ts` with: rejecting a second `kill_switch` rule per flag; validating that `variationId` belongs to the parent flag; validating `conditions` shape per `ruleType` (delegated to the shared Zod schema)
- [ ] T064 Create `apps/backend/src/modules/targeting-rules/targeting-rules.controller.ts` with CRUD nested under `/api/v1/.../flags/:flagId/rules`; DELETE allowed for `@OrgRoles('admin','editor')` per FR-042
- [ ] T065 Create `apps/backend/src/modules/targeting-rules/targeting-rules.module.ts`

### Phase 3.7: Audit Logs Module

- [ ] T066 Create `apps/backend/src/modules/audit-logs/audit-logs.repository.ts` with `findById`, `findMany({ orgId, projectId?, entityType?, actionType?, from?, to?, limit, offset })`, `insert(entry)`; only `insert` and `find` — no update/delete (immutability per FR-066)
- [ ] T067 Create `apps/backend/src/modules/audit-logs/audit-logs.service.ts` with `list(query, callerUserId)` enforcing `organizationId` from caller's session; `record({ organizationId, projectId, actionType, entityType, entityId, actor, changes })` building the entry (snapshotting `actorEmail` at write time)
- [ ] T068 Create `apps/backend/src/modules/audit-logs/audit-logs.interceptor.ts` (`@Injectable() implements NestInterceptor`): for any POST/PATCH/DELETE under `/api/v1`, capture before/after state and call `auditLogsService.record(...)`; bind via `APP_INTERCEPTOR` in `app.module.ts`
- [ ] T069 Create `apps/backend/src/modules/audit-logs/audit-logs.controller.ts` with `GET /api/v1/audit-logs` and `GET /api/v1/audit-logs/:logId`; apply `@OrgMemberGuard` to scope to caller's org
- [ ] T070 Create `apps/backend/src/modules/audit-logs/audit-logs.module.ts` and export the service for use by other modules

### Phase 3.8: Cross-cutting Wiring

- [ ] T071 Create `apps/backend/src/common/pipes/zod-validation.pipe.ts` generic NestJS pipe accepting a Zod schema and throwing `BadRequestException` with field-level error details
- [ ] T072 Create `apps/backend/src/common/filters/http-exception.filter.ts` to ensure all error responses follow the shape `{ statusCode, error, message, details? }` per management-api.md
- [ ] T073 Create `apps/backend/src/common/utils/slug.ts` exporting `slugify(input: string): string` (lowercase, hyphens, strip non-alphanumerics) used by organization/project/environment creation
- [ ] T074 Update `apps/backend/src/app.module.ts` to import all feature modules (Organizations, Projects, Environments, FeatureFlags, TargetingRules, AuditLogs), bind `APP_INTERCEPTOR` to `AuditLogsInterceptor`, and ensure `DatabaseModule` is imported once globally
- [ ] T075 Add npm scripts to `apps/backend/package.json`: `db:generate`, `db:migrate`, `db:push`, `db:studio`, `auth:generate` (wrapping the CLI), `test:unit`, `test:contract`

### Phase 3.9: Contract Tests (OPTIONAL but recommended)

- [ ] T076 [P] Create `apps/backend/test/contract/organizations.contract.spec.ts` using Supertest + Jest: register a user, create an org, GET it, PATCH it, assert response shapes match management-api.md
- [ ] T077 [P] Create `apps/backend/test/contract/feature-flags.contract.spec.ts` covering create flag (with boolean auto-variation), create with multivariate variations, list, get, update, delete — verify 403 for non-ADMIN on delete
- [ ] T078 [P] Create `apps/backend/test/contract/targeting-rules.contract.spec.ts` covering all 4 rule types, conditions validation, second kill_switch rejection, priority auto-assignment
- [ ] T079 [P] Create `apps/backend/test/contract/audit-logs.contract.spec.ts` performing a series of mutations and verifying audit entries are recorded with correct actor/email snapshot

**Checkpoint**: Phase 3 complete — all management APIs from management-api.md implemented; contract tests pass; audit interceptor records every mutation.

---

## Phase 4: Feature Flag Evaluation Engine (Lõi hệ thống)

**Purpose**: Build the deterministic evaluation engine as a pure function and expose it via the SDK-key-authenticated `/api/v1/evaluate` and `/api/v1/evaluate/all` endpoints.

**Independent Test**: Sending the same `{ flagKey, context }` to `POST /api/v1/evaluate` 1000 times returns the same result; percentage rollout over 10 000 synthetic user IDs is within 2% of target distribution; anonymous context (no userId) skips USER + PERCENTAGE rules; KILL SWITCH wins over all other rules.

### Phase 4.1: Pure Evaluation Engine

- [ ] T080 [P] Create `apps/backend/src/modules/evaluation/hash.util.ts` exporting `bucket(flagKey: string, userId: string): number` using `imurmurhash` (`murmurhash3_x86_32(\`${flagKey}:${userId}\`, 0) % 100`); with a unit test `apps/backend/src/modules/evaluation/hash.util.spec.ts` asserting determinism (same input → same output over 1000 calls) and distribution (10 000 random userIds within 2% of 30%)
- [ ] T081 [P] Create `apps/backend/src/modules/evaluation/rule-matcher.ts` exporting pure functions: `matchesKillSwitch(rule, flag)`, `matchesUserRule(rule, context)`, `matchesRoleRule(rule, context)`, `matchesPercentageRule(rule, flagKey, context)` — each returns boolean; rule-matcher has no DB/I/O dependency
- [ ] T082 Create `apps/backend/src/modules/evaluation/evaluation.engine.ts` exporting `evaluate(flag: LoadedFlag, context: EvaluationContext): EvaluationResult` as a pure function implementing the strict flow from evaluation-api.md: lifecycle check → kill switch → user → role → percentage → default; returns `{ flagKey, enabled, variationKey, resolvedValue, evaluationReason }`; includes a unit test `evaluation.engine.spec.ts` covering every priority level and every edge case (anonymous user, missing role, archived flag, draft flag, invalid attributes)
- [ ] T083 Create `apps/backend/src/modules/evaluation/flag-loader.ts` with `loadFlag(environmentId, flagKey): Promise<LoadedFlag | null>` that joins `featureFlags + variations + targetingRules` in a single query, returning null if not found; `LoadedFlag` type derived from Drizzle inference including nested `variations` and sorted `rules`
- [ ] T084 Create `apps/backend/src/modules/evaluation/evaluation.service.ts` with `evaluate(environmentId, flagKey, context)` that: (1) calls `flagLoader.loadFlag`, (2) if null returns `{ enabled: false, reason: 'FLAG_NOT_FOUND' }`, (3) calls `evaluationEngine.evaluate`, (4) wraps the whole method in a try/catch that on any throw returns the safe default with `reason: 'EVALUATION_ERROR'` and logs the error (FR-037, FR-056)
- [ ] T085 Create `apps/backend/src/modules/evaluation/safe-default.util.ts` exporting `buildSafeDefault(flag: LoadedFlag | null, flagKey: string, reason: EvaluationReason): EvaluationResult` — returns the boolean `false` if flag is null, else the flag's `defaultVariation` resolved value

### Phase 4.2: SDK Key Guard

- [ ] T086 Create `apps/backend/src/common/guards/sdk-key.guard.ts` implementing `CanActivate`: reads `X-SDK-Key` header, looks up `environments.sdkKey` via the repository, attaches `{ environmentId }` to `req.environment`; throws `UnauthorizedException` on missing/invalid key (HTTP 401)
- [ ] T087 Create `apps/backend/src/common/decorators/sdk-environment.decorator.ts` exporting `@SdkEnvironment()` to inject the resolved environment object into controller parameters

### Phase 4.3: Evaluation Controller

- [ ] T088 Create `apps/backend/src/modules/evaluation/dto/evaluate-flag.dto.ts` with `flagKey: z.string().min(1)`, `context: evaluationContextSchema`; pipe through `ZodValidationPipe`
- [ ] T089 Create `apps/backend/src/modules/evaluation/dto/evaluate-all.dto.ts` with `context: evaluationContextSchema` (no flagKey)
- [ ] T090 Create `apps/backend/src/modules/evaluation/evaluation.controller.ts` with `POST /api/v1/evaluate` (single flag) and `POST /api/v1/evaluate/all` (all active flags in env); both decorated with `@AllowAnonymous()` + `@UseGuards(SdkKeyGuard)`; controller uses `@SdkEnvironment()` to get the env, then delegates to `EvaluationService`
- [ ] T091 Create `apps/backend/src/modules/evaluation/evaluation.module.ts` importing the DatabaseModule, exporting `EvaluationService` and the controller

### Phase 4.4: Evaluation Tests (REQUIRED per spec SC-003, SC-004, SC-005, SC-006)

- [ ] T092 Create `apps/backend/test/unit/evaluation.engine.spec.ts` (Jest, no NestJS): test cases for every priority level — KILL SWITCH wins over USER; USER wins over ROLE; ROLE wins over PERCENTAGE; PERCENTAGE wins over DEFAULT; DEFAULT used when no rule matches; one rule per evaluation even when multiple match; deterministic tie-breaking by rule ID order
- [ ] T093 Create `apps/backend/test/unit/rule-matcher.spec.ts` covering: user rule matches when userId is in `userIds` and skipped when not; role rule matches when role is in `roles`; percentage rule with `bucket() < percentage` → match; kill_switch always matches when `isEnabled`
- [ ] T094 Create `apps/backend/test/integration/evaluate.endpoint.spec.ts` (Supertest): start the Nest app, seed an environment + 3 flags + rules, send `POST /api/v1/evaluate` with the SDK key; verify response shape matches evaluation-api.md; assert 401 for invalid key, 400 for missing flagKey
- [ ] T095 Create `apps/backend/test/integration/evaluate-all.endpoint.spec.ts` (Supertest): verify all active flags are evaluated; archived and draft flags are excluded; per-flag failure does not affect siblings
- [ ] T096 Create `apps/backend/test/integration/percentage-distribution.spec.ts`: seed a 30% percentage rule, call `POST /api/v1/evaluate` with 10 000 distinct synthetic userIds, assert that 28–32% receive the rollout variation (SC-005); assert the same userId always returns the same variation across 100 calls (SC-006)

### Phase 4.5: Fail-Safe Verification

- [ ] T097 Create `apps/backend/test/integration/evaluation-fail-safe.spec.ts`: simulate a database error (close the pool mid-request) and assert the endpoint still returns 200 with `enabled: false, reason: 'EVALUATION_ERROR'`; assert no unhandled promise rejection crashes the process (FR-037, FR-055, FR-056)
- [ ] T098 Create `apps/backend/test/integration/anonymous-evaluation.spec.ts`: send context with no `userId`, assert USER rules and PERCENTAGE rules are skipped (FR-034); ROLE rules are still evaluated; DEFAULT returned when no ROLE match
- [ ] T099 Create `apps/backend/test/integration/kill-switch.spec.ts` (the mandatory spec test from `plan.md`): a flag with KILL SWITCH + USER + ROLE + PERCENTAGE rules; for a context that matches ALL rules, assert the response has `reason: 'KILL_SWITCH'` and `enabled: false` (SC-004)

**Checkpoint**: Phase 4 complete — evaluation engine is deterministic, fail-safe, and enforces strict rule priority; all spec success criteria SC-003, SC-004, SC-005, SC-006, SC-008 verified by integration tests.

---

## Phase 5: Polish & Cross-Cutting Concerns (Backend-only)

**Purpose**: Backend hardening, observability, and verification before any frontend is built.

- [ ] T100 Add structured logging via `nestjs-pino` in `apps/backend/src/app.module.ts`: JSON logs in production, pretty in dev; ensure all evaluation errors are logged with `flagKey`, `environmentId`, `userId` (hashed), and stack trace
- [ ] T101 Add request ID middleware in `apps/backend/src/common/middleware/request-id.middleware.ts` injecting `X-Request-Id` into every request and response
- [ ] T102 Add health check endpoint `GET /api/v1/health` (`@AllowAnonymous()`) returning `{ status: 'ok', db: 'ok' | 'error' }`; verify DB connectivity with `SELECT 1`
- [ ] T103 Add NestJS rate limiting (`@nestjs/throttler`) configured at 10 req/min for `/api/auth/*` (FR-076) and 1000 req/min for `/api/v1/evaluate` per SDK key
- [ ] T104 Add a `cors` configuration allowing the dashboard origin (placeholder `http://localhost:5173`) and the demo origin (`http://localhost:3001`); credentials enabled for session cookies
- [ ] T105 Add a `drizzle-zod` integration in `apps/backend/src/modules/organizations/dto/` as a worked example of deriving Zod schemas from the Drizzle table definitions (document the pattern in a code comment for future modules)
- [ ] T106 Add `class-validator` validation messages localized to English with stable error codes (e.g., `flag.invalid_key`) so the frontend can render field-level errors
- [ ] T107 Add a comprehensive `README.md` in `apps/backend/` documenting: env vars, db commands, auth commands, run/test/lint scripts, and the `bodyParser: false` requirement (with link to issue if disabled)
- [ ] T108 Run `pnpm --filter backend lint` and `pnpm --filter backend typecheck`; fix all errors
- [ ] T109 Run `pnpm --filter backend test` (unit + contract + integration); ensure 100% pass; generate coverage report and target ≥80% on the evaluation engine module
- [ ] T110 Validate `specs/001-feature-flag-platform/quickstart.md` Scenarios 0, 1, 2, 4, 5, 6, 7, 8 (Auth + all backend flows). Skip Scenarios 3, 9, 10 (frontend/dashboard). Document any deviations in a `BACKEND_VALIDATION.md` file in the feature dir

**Checkpoint**: Backend is production-ready for an MVP; all P1 success criteria satisfied without any frontend or SDK code.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Infrastructure)**: No dependencies — can start immediately
- **Phase 2 (Domain Schema & Auth Guard)**: Depends on Phase 1 — BLOCKS all management and evaluation work
- **Phase 3 (Management APIs & Shared)**: Depends on Phase 2 — Provides CRUD endpoints for evaluation tests
- **Phase 4 (Evaluation Engine)**: Depends on Phase 2 (schema) AND Phase 3 (seed data via API); Phase 4.1 (pure engine + unit tests) can be done in parallel with Phase 3 once Phase 2 is done
- **Phase 5 (Polish)**: Depends on all prior phases

### Within Each Phase

- T002 (shared dep) must precede T040 (shared index barrel)
- T013–T020 (schema tables) can be done in parallel
- T021 (schema barrel) requires T013–T020
- T022–T025 (guard infrastructure) can be done in parallel with T013–T020
- T026 (global AuthGuard wiring) requires T008 (AuthModule) and T022
- T041–T044 (org module) can be parallelized with T046–T050 (projects module) once Phase 2 is done
- T080–T082 (pure engine) require NO backend running — can be developed with TDD before Phase 2
- T086 (SDK key guard) can run in parallel with T090 (evaluation controller) once T083 exists
- T076–T079 (contract tests) and T092–T099 (evaluation tests) MUST be written and FAIL before corresponding implementation

### Cross-Phase Parallelism

Once Phase 2 is complete:
- **Track A**: Phase 3 management APIs (T041–T074)
- **Track B**: Phase 4.1 pure engine + tests (T080–T085, T092–T093)
- **Track C**: Phase 4.2–4.3 evaluation controller (T086–T091)

Tracks A and B can run fully in parallel. Track C depends on Track B (T083 `flag-loader`) and Track A (env/flag CRUD to seed data).

---

## Parallel Examples

### Phase 1 (T001–T012)

```bash
# Parallel dependency installs
Task: "T001 Install backend dependencies in apps/backend/package.json"
Task: "T002 Add shared package Zod dependency in packages/shared/package.json"

# Parallel env + config
Task: "T003 Create apps/backend/.env and .env.example"
Task: "T004 Create apps/backend/drizzle.config.ts"
Task: "T005 Create apps/backend/src/db/index.ts"
```

### Phase 2.1 (T013–T021)

```bash
# All 8 platform tables can be added in parallel
Task: "T013 Define organizations table"
Task: "T014 Define organizationMembers table"
Task: "T015 Define projects table"
Task: "T016 Define environments table"
Task: "T017 Define featureFlags table"
Task: "T018 Define variations table"
Task: "T019 Define targetingRules table"
Task: "T020 Define auditLogs table"
```

### Phase 3.1 (T030–T040)

```bash
# All 9 shared Zod schema files are independent
Task: "T030 Create packages/shared/src/schemas/enums.ts"
Task: "T031 Create packages/shared/src/schemas/evaluation-context.ts"
Task: "T032 Create packages/shared/src/schemas/rule-conditions.ts"
Task: "T033 Create packages/shared/src/schemas/variation.ts"
Task: "T034 Create packages/shared/src/schemas/feature-flag.ts"
Task: "T035 Create packages/shared/src/schemas/targeting-rule.ts"
Task: "T036 Create packages/shared/src/schemas/{organization,project,environment}.ts"
Task: "T037 Create packages/shared/src/schemas/evaluation-result.ts"
Task: "T038 Create packages/shared/src/constants/roles.ts"
Task: "T039 Create packages/shared/src/constants/reasons.ts"
```

### Phase 4.4 (T092–T099)

```bash
# All evaluation tests can be authored in parallel
Task: "T092 Unit tests for evaluation engine"
Task: "T093 Unit tests for rule matcher"
Task: "T094 Integration test for /api/v1/evaluate"
Task: "T095 Integration test for /api/v1/evaluate/all"
Task: "T096 Integration test for percentage distribution"
Task: "T097 Integration test for fail-safe behavior"
Task: "T098 Integration test for anonymous evaluation"
Task: "T099 Integration test for kill switch priority"
```

---

## Implementation Strategy

### MVP First (Phases 1–4 minimum, no Phase 5)

1. Complete Phase 1 — backend boots, auth schema exists
2. Complete Phase 2 — DB tables and global guard work
3. Complete Phase 3.1 (shared Zod) + Phase 3.2 (organizations) + Phase 3.3 (projects) + Phase 3.5 (feature flags) + Phase 3.6 (targeting rules) — minimum CRUD to seed evaluation data
4. Complete Phase 4.1 (pure engine) + Phase 4.2 (SDK guard) + Phase 4.3 (controller) + Phase 4.4 tests — evaluation is the core value
5. **STOP and VALIDATE**: run `quickstart.md` Scenarios 0, 1, 2, 4, 5, 6, 7, 8
6. The system can already serve SDKs and integration tests against the real evaluation engine

### Incremental Delivery

- After Phase 1 + 2: DB foundation solid, can iterate on any module
- After Phase 3.7 + 3.8: All management APIs done, frontend can later consume them
- After Phase 4: Evaluation engine live, SDKs and demo app can be built (out of scope for this task list)
- After Phase 5: Production-ready backend

### Parallel Team Strategy (2 developers)

- **Dev A**: Phase 1 → Phase 2 → Phase 3 (management APIs)
- **Dev B**: Phase 4.1 (pure engine + unit tests) starting after Phase 2, then Phase 4.2–4.3
- Both meet for Phase 4.4 (integration tests) which requires both tracks

### Notes for the Implementing LLM

- The Better Auth CLI in T009 MUST use the project's own `auth.config.ts` as input; do not manually edit the generated `auth-schema.ts` afterwards.
- `bodyParser: false` (T011) is non-negotiable per the `@thallesp/nestjs-better-auth` adapter requirement; the auth handler must receive the raw body.
- The pure engine (T082) MUST remain side-effect-free — no DB, no logger, no clock. Pass `Date.now()` or equivalent from the caller if needed.
- Audit log inserts (T068) must be transactional with the mutation, OR explicitly fire-and-forget with retry — choose transactional for FR-066 immutability.
- `drizzle-kit push` is for local dev; `drizzle-kit generate` + `drizzle-kit migrate` is for CI/prod.
- Do NOT add a `frontend` or `demo` directory in this scope; those task lists will be generated separately.
