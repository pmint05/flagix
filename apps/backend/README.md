# Flagix Backend

NestJS backend for the Flagix Feature Flag Management platform.

## Prerequisites

- Node.js 20+ LTS
- pnpm 10+
- Docker (for PostgreSQL)

## Quick Start

```bash
# Start PostgreSQL
docker compose -f ../../infra/docker/docker-compose.yml up -d

# Install dependencies
pnpm install

# Push schema to database
pnpm --filter backend db:push

# Generate Better Auth schema
pnpm --filter backend auth:generate

# Start dev server
pnpm --filter backend dev
```

Server runs at `http://localhost:9000/api/v1`.

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | `postgresql://flagix:root@localhost:5432/flagix_dev` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Yes | — | 32+ char secret for session signing |
| `BETTER_AUTH_URL` | Yes | `http://localhost:9000` | Base URL for auth callbacks |
| `PORT` | No | `9000` | Server port |
| `NODE_ENV` | No | `development` | `production` enables JSON logs |
| `WHITE_LISTED_ORIGINS` | No | `http://localhost:3000,http://localhost:5173` | Comma-separated CORS origins |

## Scripts

```bash
# Development
pnpm --filter backend dev          # Watch mode
pnpm --filter backend start:debug  # Debug mode

# Database
pnpm --filter backend db:push      # Push schema (dev)
pnpm --filter backend db:generate  # Generate migrations
pnpm --filter backend db:migrate   # Run migrations
pnpm --filter backend db:studio    # Drizzle Studio UI

# Auth
pnpm --filter backend auth:generate  # Regenerate auth-schema.ts

# Build
pnpm --filter backend build

# Test
pnpm --filter backend test          # All tests
pnpm --filter backend test:unit     # Unit tests only
pnpm --filter backend test:contract # Contract tests only
pnpm --filter backend test:cov      # With coverage

# Lint
pnpm --filter backend lint
```

## Architecture

```
src/
├── modules/
│   ├── auth/           # Better Auth configuration
│   ├── organizations/  # Multi-tenant org management
│   ├── projects/       # Project CRUD
│   ├── environments/   # Environment management
│   ├── feature-flags/  # Flag lifecycle (draft → active → archived)
│   ├── targeting-rules/# Rule engine (kill switch, user, role, percentage)
│   ├── evaluation/     # Deterministic flag evaluation (SDK endpoint)
│   ├── sdk-keys/       # SDK key management (SHA-256 hashed)
│   ├── audit-logs/     # Immutable audit trail
│   └── health/         # Health check endpoint
├── common/
│   ├── guards/         # AuthGuard, OrgRolesGuard, SdkKeyGuard
│   ├── decorators/     # @CurrentUser, @PlatformOrgRoles, @SdkEnvironment
│   ├── filters/        # Global exception filter
│   ├── interceptors/   # Audit logging, response transform
│   ├── middleware/      # Request ID injection
│   ├── pipes/          # Validation pipe with stable error codes
│   └── utils/          # Fractional indexing, crypto, slug utilities
└── db/
    ├── schema/         # Drizzle table definitions
    └── migrations/     # Generated SQL migrations
```

## Key Design Decisions

### `bodyParser: false`

The Better Auth adapter requires the raw request body for signature verification. The global `bodyParser: false` setting in `NestFactory.create()` is **mandatory**. Do not enable body parsing globally — NestJS pipes and class-validator work correctly with this setting.

### SDK Key Security

Raw SDK keys are shown **only once** at creation time. The backend stores only SHA-256 hashes with 8-character prefixes for lookup. Lost keys must be regenerated.

### Evaluation Engine

The evaluation engine (`src/modules/evaluation/`) is a pure function with no side effects. It enforces strict rule priority: Kill Switch > User > Role > Percentage > Default. All failures return safe defaults (`enabled: false`).

### Rate Limiting

| Route | Limit | Scope |
|---|---|---|
| `/api/auth/*` | 10 req/min | Per IP |
| `/api/v1/evaluate` | 1000 req/min | Per SDK key |

### Validation Errors

All validation errors return a consistent shape:

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

Error codes follow the pattern: `{entity}.{field}.{constraint}`.

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/health` | None | Health check |
| `POST` | `/api/v1/organizations` | Session | Create organization |
| `GET` | `/api/v1/organizations` | Session | List user's organizations |
| `POST` | `/api/v1/evaluate` | SDK Key | Evaluate single flag |
| `POST` | `/api/v1/evaluate/all` | SDK Key | Evaluate all flags in env |

Full API docs available at:
- Swagger UI: `http://localhost:9000/swagger`
- Scalar UI: `http://localhost:9000/api/docs`
