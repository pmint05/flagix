# Flagix Backend

NestJS API server for the Flagix feature flag management platform. Provides multi-tenant RBAC, deterministic flag evaluation, real-time SSE streaming, and audit logging.

## Prerequisites

- Node.js 20+ LTS
- pnpm 10+
- Docker (for PostgreSQL and Redis)

## Quick Start

Run from the monorepo root:

```bash
# 1. Start infrastructure
pnpm run db:up

# 2. Install dependencies
pnpm install

# 3. Generate Better Auth schema (must run before db:push)
pnpm --filter backend auth:generate

# 4. Push schema to database
pnpm --filter backend db:push

# 5. Seed demo data
pnpm --filter backend db:seed

# 6. Start dev server
pnpm --filter backend dev
```

Server runs at `http://localhost:9000`. API docs at `http://localhost:9000/api/docs` (Scalar) and `http://localhost:9000/swagger` (Swagger).

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | `postgresql://flagix:root@localhost:5432/flagix_dev` | PostgreSQL connection string |
| `REDIS_URL` | Yes | `redis://localhost:6379` | Redis connection string |
| `BETTER_AUTH_SECRET` | Yes | (none) | 32+ character secret for session signing |
| `BETTER_AUTH_URL` | Yes | `http://localhost:9000` | Base URL for auth callbacks |
| `PORT` | No | `9000` | Server port |
| `NODE_ENV` | No | `development` | Set to `production` for JSON logging |
| `WHITE_LISTED_ORIGINS` | No | `http://localhost:3000,http://localhost:3001` | CORS origins (comma-separated) |

## Scripts

```bash
# Development
pnpm --filter backend dev            # Watch mode on port 9000
pnpm --filter backend start:debug    # Debug mode with inspector

# Database
pnpm --filter backend db:push        # Push schema directly (development)
pnpm --filter backend db:generate    # Generate migration files
pnpm --filter backend db:migrate     # Run pending migrations
pnpm --filter backend db:seed        # Seed demo data
pnpm --filter backend db:studio      # Open Drizzle Studio UI

# Auth
pnpm --filter backend auth:generate  # Regenerate Better Auth schema file

# Build
pnpm --filter backend build

# Testing
pnpm --filter backend test           # All tests
pnpm --filter backend test:unit      # Unit tests (src/**/*.spec.ts)
pnpm --filter backend test:contract  # Contract tests (test/contract/)
pnpm --filter backend test:cov       # With coverage report

# Lint
pnpm --filter backend lint
```

## Architecture

```
src/
  modules/
    auth/                   Better Auth configuration and session management
    organizations/          Multi-tenant org CRUD and invitations
    projects/               Project CRUD scoped to organization
    environments/           Environment management (soft-delete support)
    feature-flags/          Flag lifecycle: Draft -> Active -> Archived
    targeting-rules/        Rule engine (kill_switch, user, role, percentage, custom, segment)
    evaluation/             Deterministic evaluation engine (pure functions)
    sdk-keys/               SDK key generation and revocation (SHA-256 hashed)
    audit-logs/             Immutable audit trail for all mutations
    users/                  User profile management
    tags/                   Tag CRUD for flag categorization
    segments/               User segment management for rule targeting
    flag-changes/           Flag change history tracking
    evaluation-collector/   Evaluation event ingestion (BullMQ queue)
    evaluation-events/      Evaluation event storage and retrieval
    evaluation-aggregator/  Hourly statistics aggregation
    evaluation-stream/      SSE streaming for real-time monitoring
    evaluation-analytics/   Analytics API (flag metrics, trend data)
    flag-config-cache/      Redis-based flag configuration cache
    health/                 Health check endpoint
  common/
    guards/                 AuthGuard, OrgRolesGuard, SdkKeyGuard
    decorators/             @CurrentUser, @PlatformOrgRoles, @SdkEnvironment
    filters/                Global exception filter with stable error codes
    interceptors/           Audit logging interceptor, response transformation
    middleware/              Request ID injection and audit context
    pipes/                  Zod validation pipe
    utils/                  Fractional indexing, crypto hashing, slug generation
  db/
    schema/                 Drizzle ORM table definitions (18 files)
    seed.ts                 Demo data seeder
```

## Key Design Decisions

### SDK Key Security

Raw SDK keys are displayed only once at creation time. The backend stores SHA-256 hashes with an 8-character prefix (`keyHint`) for identification. A lost key cannot be recovered and must be regenerated.

### Evaluation Engine

The evaluation engine at `src/modules/evaluation/` operates as a set of pure functions with no side effects. Rule priority is strict: Kill Switch > Segment > User > Role > Percentage > Custom > Default. When evaluation fails for any reason (missing context, backend error, flag not found), the engine returns a safe fallback (`enabled: false`, default variation). This guarantees that applications never break due to a flag evaluation error.

### Rule Conditions

Custom targeting rules use `type + operator + value` triples to match against `EvaluationContext` attributes. Supported types are `string`, `number`, `boolean`, `object`, `array`, `semver`, and `date`. All conditions within a rule are evaluated with AND logic. Multiple rules on a flag are evaluated in priority order until the first match.

### Rate Limiting

| Route | Limit | Scope |
|---|---|---|
| `/api/auth/*` | 10 req/min | Per IP address |
| `/api/v1/evaluate*` | 1000 req/min | Per SDK key |

### Validation Error Format

All validation errors follow a consistent structure with stable machine-readable codes:

```json
{
  "statusCode": 400,
  "error": "ValidationException",
  "message": "Organization name is required",
  "details": [
    {
      "field": "name",
      "code": "create_organization.name.isNotEmpty",
      "message": "Organization name is required"
    }
  ]
}
```

Error codes follow the pattern `{entity}.{field}.{constraint}` for programmatic handling.

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | None | Health check |
| `GET` | `/swagger` | None | Swagger UI |
| `GET` | `/api/docs` | None | Scalar API reference |
| `GET` | `/api/auth/*` | None | Better Auth endpoints (session, sign-in, sign-up) |
| `POST` | `/api/v1/organizations` | Session | Create organization |
| `GET` | `/api/v1/organizations` | Session | List organizations |
| `POST` | `/api/v1/projects` | Session | Create project |
| `GET` | `/api/v1/projects` | Session | List projects |
| `POST` | `/api/v1/flags` | Session | Create feature flag |
| `GET` | `/api/v1/flags` | Session | List feature flags |
| `PATCH` | `/api/v1/flags/:id` | Session | Update feature flag |
| `DELETE` | `/api/v1/flags/:id` | Session | Archive feature flag |
| `POST` | `/api/v1/rules` | Session | Create targeting rule |
| `PATCH` | `/api/v1/rules/:id` | Session | Update targeting rule |
| `DELETE` | `/api/v1/rules/:id` | Session | Delete targeting rule |
| `POST` | `/api/v1/sdk-keys` | Session | Generate SDK key |
| `GET` | `/api/v1/sdk-keys` | Session | List SDK keys (masked) |
| `POST` | `/api/v1/evaluate` | SDK Key | Evaluate a single flag |
| `POST` | `/api/v1/evaluate/all` | SDK Key | Evaluate all flags for an environment |
| `GET` | `/api/v1/flags/stream` | SDK Key | SSE stream for real-time flag updates |
| `GET` | `/api/v1/audit-logs` | Session | Query audit logs |
| `GET` | `/api/v1/analytics/*` | Session | Flag evaluation analytics |

## Demo Seed Data

Running `db:seed` creates:

- Organization: "Developer's Organization" (slug: `developer-org`)
- Project: "Default Project" (slug: `default-project`)
- Environments: `development`, `production`
- Admin account: `dev@flagix.com` / `password123`
- SDK keys: 2 client keys, 2 server keys across both environments
- 8 feature flags with variations and targeting rules (see root README for details)
