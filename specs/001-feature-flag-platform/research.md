# Research: Feature Flag Platform (Phase 1)

**Feature**: 001-feature-flag-platform
**Date**: 2026-06-07

## R1: Drizzle ORM Version & NestJS Integration

**Decision**: Use `drizzle-orm@0.45.2` with `pg` (node-postgres) driver. Integrate via custom NestJS provider (no third-party module).

**Rationale**:
- Drizzle ORM 0.45.2 is the latest stable release; v1.0.0-beta exists but is not production-ready.
- `pg` is the primary driver recommended in Drizzle's official documentation.
- Community NestJS-Drizzle packages (`nestjs-drizzle`, `@knaadh/nestjs-drizzle-pg`) are poorly maintained (last published 1-2 years ago, low download counts).
- Drizzle is lightweight (~7.4kb, 0 deps) and trivially wraps into a NestJS custom provider/module, giving full control.

**Alternatives considered**:
- `nestjs-drizzle` community package — rejected due to poor maintenance and low adoption.
- `postgres.js` driver — viable alternative to `pg`, but `pg` has broader ecosystem support and is the Drizzle-recommended default.

**Implementation approach**:
- Create `DatabaseModule` with custom provider wrapping `drizzle()` connection.
- Inject via `@Inject('DB')` token in services.
- Migrations managed via `drizzle-kit@0.31.10` CLI (`generate`, `migrate`, `push` commands).
- Config file: `drizzle.config.ts` at `apps/backend/` root.

---

## R2: Zod Schema Integration Strategy

**Decision**: Use Zod schemas in `packages/shared` for cross-package type definitions. Backend uses class-validator for NestJS DTO validation, with Zod schemas serving as the single source of truth for shared types and SDK validation.

**Rationale**:
- Constitution requires class-validator for backend and Zod for dashboard.
- Shared Zod schemas in `packages/shared` provide type-safe contracts between backend and frontend/SDKs.
- Backend DTOs use class-validator decorators (NestJS convention) but derive types from shared Zod schemas where overlap exists.
- SDK packages use Zod directly for context validation (no class-validator dependency in SDKs).

**Alternatives considered**:
- Using only Zod everywhere — rejected because NestJS ecosystem is built around class-validator/class-transformer.
- Using only class-validator everywhere — rejected because SDKs and frontend need Zod.

**Implementation approach**:
- `packages/shared/src/schemas/` — Zod schemas for evaluation context, flag types, rule types.
- `apps/backend/src/modules/*/dto/` — class-validator DTOs for API endpoints.
- Shared types exported from `@flagix/shared` package.

---

## R3: Deterministic Hashing Algorithm for Percentage Rollout

**Decision**: Use MurmurHash3 (x86, 32-bit) for percentage rollout bucket assignment.

**Rationale**:
- Industry standard: Unleash uses MurmurHash3 across all SDKs with billions of evaluations.
- Speed: ~3100-5000 MB/s, 10-15x faster than SHA-1. Critical for hot-path evaluation.
- Distribution: Excellent uniformity across 100 buckets (verified by SMHasher test suite, <0.25% bias).
- Deterministic: Same input always produces same output.
- No cryptographic overhead needed for bucketing.

**Formula**: `murmurhash3_x86_32("${flagKey}:${userId}", seed) % 100`

**npm package**: `imurmurhash` (zero dependencies, fast, well-maintained).

**Alternatives considered**:
- SHA-1 (used by LaunchDarkly) — rejected due to unnecessary cryptographic overhead (~200-300 MB/s vs ~3100-5000 MB/s).
- SHA-256 — rejected, even slower (~150-200 MB/s).
- xxHash — fastest (~5500+ MB/s) but less established in feature flag ecosystem.
- FNV-1a — simpler but weaker distribution quality.
- MD5 — broken cryptographically, no advantage over MurmurHash3.

---

## R4: Real-Time Flag Updates (SSE vs Polling)

**Decision**: Hybrid approach — SSE as primary delivery mechanism, HTTP polling as fallback.

**Rationale**:
- SSE provides near-instant flag propagation (critical for kill switches, progressive rollouts).
- Polling fallback handles SSE disconnections, proxy issues, and simpler SDK implementations.
- This is the proven pattern used by LaunchDarkly (SSE primary, polling fallback).
- Constitution (Principle IV) explicitly requires "SSE or Polling" for real-time sync.

**Alternatives considered**:
- SSE only — rejected because long-lived connections can be problematic behind proxies/firewalls.
- Polling only — rejected because latency is bounded by poll interval (15-30s), too slow for kill switches.
- WebSockets — rejected as overkill for unidirectional server-to-client communication.

**Implementation approach**:
- NestJS built-in `@Sse()` decorator for SSE endpoints (no extra package needed).
- RxJS `Subject`/`BehaviorSubject` for broadcasting flag changes to connected SSE clients.
- Polling endpoint with `ETag`/`If-None-Match` headers for efficient 304 responses.
- Internal event bus via `@nestjs/event-emitter` for flag change propagation.
- SDK subscribes to SSE on init; falls back to polling if SSE connection fails.

---

## R5: NestJS Module Architecture

**Decision**: Feature-based module organization following NestJS conventions.

**Rationale**:
- Each domain entity (organizations, projects, environments, feature-flags, targeting-rules, evaluation, audit-logs) gets its own NestJS module.
- Modules are self-contained with their own controllers, services, and repository providers.
- Cross-module dependencies injected via NestJS DI container.

**Module structure**:
- `OrganizationsModule` — CRUD for organizations
- `ProjectsModule` — CRUD for projects (depends on OrganizationsModule)
- `EnvironmentsModule` — CRUD for environments (depends on ProjectsModule)
- `FeatureFlagsModule` — CRUD for flags + lifecycle management (depends on EnvironmentsModule)
- `TargetingRulesModule` — CRUD for rules (depends on FeatureFlagsModule)
- `EvaluationModule` — Evaluation engine (depends on FeatureFlagsModule, TargetingRulesModule)
- `AuditLogsModule` — Read-only audit log queries (independent)

**Cross-cutting concerns**:
- `DatabaseModule` — Drizzle ORM connection provider (global)
- `AuthModule` — Better Auth configuration and NestJS integration via `@thallesp/nestjs-better-auth`
- `RbacModule` — Role-based access control guards (organization-scoped)
- `AuditInterceptor` — Global interceptor for audit log recording

---

## R6: Evaluation Engine Architecture

**Decision**: Pure function evaluation engine implemented as a NestJS service with no side effects.

**Rationale**:
- Constitution Principle III requires evaluation to be a pure function with no side effects.
- Evaluation service receives flag data and context as input, returns evaluation result.
- No database calls within evaluation logic (data fetched by controller/service before calling engine).
- Deterministic: same input → same output, guaranteed.

**Evaluation flow**:
1. Controller receives evaluation request (flagKey + context)
2. Service fetches flag data (flag + rules + variations) from database
3. Pure evaluation function processes: lifecycle check → kill switch → user rules → role rules → percentage rules → default
4. Result returned with evaluation reason for debugging

**Error handling**:
- Any exception during evaluation → return safe default (flag OFF or default variation)
- Errors logged via structured logging but never propagated to client
- SDK receives safe default even on complete backend failure

---

## R7: Better Auth Integration with NestJS

**Decision**: Use Better Auth (`better-auth` package) as the authentication framework, integrated into NestJS via the `@thallesp/nestjs-better-auth` community adapter.

**Rationale**:
- Better Auth is a comprehensive, framework-agnostic TypeScript authentication framework with built-in support for email/password auth, session management, social sign-on, 2FA, and organizations/RBAC.
- The `@thallesp/nestjs-better-auth` adapter (547 stars, listed in official Better Auth docs) provides seamless NestJS integration including global AuthGuard, decorators (`@Session()`, `@AllowAnonymous()`, `@OrgRoles()`), and automatic mounting of auth API routes.
- Better Auth auto-generates database schema for user, session, account, and verification tables via CLI (`npx auth@latest generate`), eliminating manual schema writing for auth tables.
- Cookie-based session management with server-side verification provides secure, stateless-friendly authentication.
- Plugin ecosystem allows future extension to OAuth2/SSO without architectural changes.

**Alternatives considered**:
- Passport.js — rejected due to manual implementation burden for sessions, password hashing, and rate limiting.
- Custom auth implementation — rejected due to security risks and maintenance overhead.
- Lucia Auth — viable alternative but smaller ecosystem and less NestJS integration support.
- NextAuth/Auth.js — designed for Next.js, not suitable for standalone NestJS backend.

**Integration approach**:
- Disable NestJS body parser (`bodyParser: false` in `NestFactory.create`) as required by the adapter.
- Import `AuthModule.forRoot({ auth })` in root AppModule.
- Global AuthGuard protects all routes by default; use `@AllowAnonymous()` for public routes (evaluation API uses SDK keys, not sessions).
- Better Auth schema generated via `npx auth@latest generate` into `apps/backend/src/db/schema/auth-schema.ts`.
- Platform-specific tables (organizations, projects, etc.) defined separately in `apps/backend/src/db/schema/` directory (per-entity files with barrel `index.ts`) with `user_id` FK referencing Better Auth's `user` table.

**Auto-generated database tables** (via Better Auth CLI):
- `user` — id, name, email, emailVerified, image, createdAt, updatedAt
- `session` — id, userId (FK → user), token, expiresAt, ipAddress, userAgent, createdAt, updatedAt
- `account` — id, userId (FK → user), accountId, providerId, accessToken, refreshToken, password, scope, idToken, createdAt, updatedAt
- `verification` — id, identifier, value, expiresAt, createdAt, updatedAt

**Session management**:
- Cookie-based by default (session token in HTTP cookie, verified server-side against DB)
- Default expiration: 7 days with sliding refresh (updated every 1 day)
- Session freshness: 1 day (configurable)

**Auth API endpoints** (mounted at `/api/auth/*`):
- `POST /api/auth/sign-up/email` — Email/password registration
- `POST /api/auth/sign-in/email` — Email/password login
- `POST /api/auth/sign-out` — Sign out (end session)
- `GET|POST /api/auth/get-session` — Validate & retrieve current session
- `POST /api/auth/change-password` — Change password
- `POST /api/auth/forget-password` — Initiate password reset
- `POST /api/auth/reset-password` — Complete password reset
- `GET /api/auth/verify-email` — Email verification
- `POST /api/auth/update-user` — Update user profile
- `GET /api/auth/list-sessions` — List active sessions
- `POST /api/auth/revoke-session` — Revoke a specific session

**Route protection pattern**:
- Global AuthGuard enabled by default (all management routes protected)
- `@AllowAnonymous()` decorator for public routes
- `@Session()` decorator to inject session/user into controller parameters
- Evaluation API routes use SDK key authentication (separate from session auth), marked with `@AllowAnonymous()` and custom SDK key guard
