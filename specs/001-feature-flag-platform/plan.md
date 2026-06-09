# Implementation Plan: Feature Flag Platform (Domain Model)

**Branch**: `001-feature-flag-platform` | **Date**: 2026-06-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-feature-flag-platform/spec.md`

## Summary

Build the core domain model and evaluation engine for a multi-tenant Feature Flag SaaS platform. The system enables organizations to create and manage feature flags with lifecycle states (Draft → Active → Archived), configure targeting rules (Kill Switch, User, Role, Percentage Rollout), and evaluate flags deterministically via SDK or API. Authentication is handled by Better Auth integrated into the NestJS backend, providing email/password auth, session management, and route protection via guards. The backend owns all evaluation logic; SDKs only send context, receive results, and cache locally with hybrid TTL + real-time updates.

## Technical Context

**Language/Version**: TypeScript 5.7+ (strict mode)

**Primary Dependencies**: 
- Backend: NestJS 11.x, Drizzle ORM 0.45.x, pg (node-postgres)
- Authentication: Better Auth (better-auth) with `@thallesp/nestjs-better-auth` adapter
- Validation: class-validator 0.15.x, Zod (shared schemas in packages/shared)
- Hashing: imurmurhash (MurmurHash3 x86 32-bit for percentage rollout)
- Database: PostgreSQL 15+ (via Docker)
- Testing: Jest 30.x, Supertest 7.x

**Storage**: PostgreSQL running on local Docker (infra/docker/docker-compose.yml)

**Testing**: Jest for unit/integration tests, Supertest for API contract tests

**Target Platform**: Node.js 20+ LTS, Linux containers

**Project Type**: Web service (REST API) + SDK packages

**Performance Goals**: 
- Evaluation API: <100ms p95 latency (SC-010)
- Support 1000+ concurrent evaluation requests

**Constraints**: 
- Deterministic evaluation (no randomness)
- 100% fail-safe behavior (never crash clients)
- Multi-tenant isolation at all layers

**Scale/Scope**: 
- Phase 1: Single-region deployment
- Target: 10-50 organizations, 100-500 flags per org
- Audit log: 90 days active retention + cold storage archival

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Monorepo & Workspace Integrity
- ✅ Uses pnpm as package manager (package.json: "packageManager": "pnpm@10.33.4")
- ✅ Cross-package dependencies use workspace:* protocol
- ✅ No nested .git directories
- ✅ .env files scoped to apps/backend, apps/frontend, apps/demo

**Status**: PASS

### Principle II: Technology Stack Compliance
- ✅ Backend uses NestJS 11.x
- ✅ Drizzle ORM 0.45.x with pg driver (custom NestJS provider)
- ✅ PostgreSQL on Docker (infra/docker/docker-compose.yml)
- ✅ TypeScript strict mode (tsconfig.base.json)

**Status**: PASS

### Principle III: Deterministic Evaluation
- ✅ Spec requires 100% deterministic evaluation (FR-031, FR-032)
- ✅ Percentage rollout uses stable hashing (FR-026, FR-027)
- ✅ Evaluation engine is pure function (no side effects)

**Status**: PASS

### Principle IV: Separation of Concerns
- ✅ SDK packages (sdk-core, sdk-react) contain no evaluation logic (FR-049, FR-050)
- ✅ Backend owns all evaluation logic (FR-033)
- ✅ SDKs only send context, receive results, cache (FR-045, FR-046)

**Status**: PASS

### Principle V: Rule Priority System
- ✅ Spec defines strict priority: KILL SWITCH > USER > ROLE > PERCENTAGE > DEFAULT (FR-021)
- ✅ Kill Switch short-circuits all rules (FR-023a)
- ✅ Only one rule wins per evaluation (FR-022)

**Status**: PASS

### Principle VI: Fail-Safe Principle
- ✅ System returns safe default on any failure (FR-037, FR-052)
- ✅ SDK returns cached or default values when backend unavailable (FR-047, FR-051)
- ✅ Failures logged but not propagated to users (FR-056)

**Status**: PASS

### Principle VII: Data Validation & Integrity
- ✅ Backend uses class-validator for DTOs (NestJS convention)
- ✅ Shared Zod schemas in packages/shared for cross-package type safety
- ✅ SDK packages use Zod directly for context validation
- ✅ Invalid payloads return HTTP 400

**Status**: PASS

### Principle VIII: Variation Model
- ✅ Flags support boolean, string, JSON object variations (FR-015)
- ✅ Every flag has explicit default variation (FR-016)
- ✅ Variation types enforced at creation (FR-018, FR-019)

**Status**: PASS

### Principle IX: Multi-Tenant Isolation & Security
- ✅ All entities scoped by organization_id (FR-001, FR-002)
- ✅ Cross-tenant access prevented (FR-003)
- ✅ SDK keys are read-only, environment-scoped (assumption)
- ✅ User authentication via Better Auth with cookie-based sessions (FR-067 to FR-078)
- ✅ Management API routes protected by AuthGuard (session validation)
- ✅ User-organization membership enforces tenant boundaries (FR-079 to FR-088)

**Status**: PASS

### Principle X: Auditability
- ✅ All mutations recorded in immutable audit log (FR-061, FR-066)
- ✅ Audit entries include: timestamp, actor, action, entity, before/after state (FR-062)
- ✅ 90 days active retention + cold storage archival (FR-063, FR-064, FR-065)

**Status**: PASS

**Overall Constitution Check**: PASS (no violations, all action items resolved in Phase 0 research)

## Project Structure

### Documentation (this feature)

```text
specs/001-feature-flag-platform/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── evaluation-api.md
│   └── management-api.md
├── checklists/          # Quality checklists
│   └── requirements.md
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
apps/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/                # Better Auth configuration & setup
│   │   │   ├── organizations/
│   │   │   ├── projects/
│   │   │   ├── environments/
│   │   │   ├── feature-flags/
│   │   │   ├── targeting-rules/
│   │   │   ├── evaluation/
│   │   │   └── audit-logs/
│   │   ├── db/
│   │   │   ├── schema/              # Drizzle schema definitions (all tables)
│   │   │   │   ├── index.ts         # Barrel re-export of all schema files
│   │   │   │   ├── auth-schema.ts   # Better Auth auto-generated schema (user, session, account, verification)
│   │   │   │   ├── organizations.ts
│   │   │   │   ├── organization-members.ts
│   │   │   │   ├── projects.ts
│   │   │   │   ├── environments.ts
│   │   │   │   ├── feature-flags.ts
│   │   │   │   ├── variations.ts
│   │   │   │   ├── targeting-rules.ts
│   │   │   │   ├── audit-logs.ts
│   │   │   │   └── user-relations.ts
│   │   │   ├── migrations/        # Drizzle migrations
│   │   │   └── index.ts           # Database connection
│   │   ├── common/
│   │   │   ├── guards/            # RBAC guards (AuthGuard provided by @thallesp/nestjs-better-auth)
│   │   │   ├── decorators/        # Custom decorators (@Session, @AllowAnonymous, @OrgRoles)
│   │   │   ├── filters/           # Exception filters
│   │   │   └── interceptors/      # Audit logging interceptor
│   │   └── main.ts
│   └── test/
│       ├── contract/              # API contract tests
│       ├── integration/           # Integration tests
│       └── unit/                  # Unit tests
├── frontend/                      # Admin dashboard (out of scope for this plan)
└── demo/                          # Demo app (out of scope for this plan)

packages/
├── shared/
│   └── src/
│       ├── types/                 # Shared TypeScript types
│       ├── schemas/               # Zod validation schemas
│       └── constants/             # Shared constants
├── sdk-core/                      # Core SDK logic (out of scope for this plan)
├── sdk-react/                     # React SDK (out of scope for this plan)
└── utils/                         # Shared utilities

infra/
└── docker/
    └── docker-compose.yml         # PostgreSQL container
```

**Structure Decision**: Monorepo with NestJS backend in `apps/backend/`, shared types/schemas in `packages/shared/`. Backend follows NestJS module pattern with feature-based organization. Authentication handled by Better Auth via `@thallesp/nestjs-better-auth` adapter with global AuthGuard. Better Auth auto-generates `auth-schema.ts` (user, session, account, verification tables) via CLI; platform-specific tables defined in `src/db/schema/` directory with per-entity files and a barrel `index.ts`. Database migrations managed by Drizzle ORM in `apps/backend/src/db/`.

## Complexity Tracking

> **No constitution violations requiring justification.**
