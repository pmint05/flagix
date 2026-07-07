# Flagix - Feature Flag Management Platform

Flagix is a real-time feature flag platform with multi-tenant RBAC, built as a pnpm + Turborepo monorepo. It provides a management dashboard, SDKs for client and server integration, and real-time flag updates via Server-Sent Events.

## Architecture

```
apps/
  backend/          NestJS API server (port 9000)
  frontend/         React admin dashboard (port 3000)
  demo/
    client/         React SPA - landing page demo (port 3001)
    server/         Express.js API - BFF demo (port 3002)
packages/
  sdk-core/         TypeScript SDK (universal: browser + Node.js)
  sdk-react/        React wrapper (FlagixProvider, useFlag hook)
  shared/           Zod schemas and shared types
infra/
  docker/           Docker Compose files for PostgreSQL and Redis
```

**Demo architecture:**

```
Demo Client (React)       Demo Server (Express)        Flagix Backend (NestJS)
     |                          |                             |
     |  useFlag('dark-mode')    |                             |
     |------------------------------------------------------>|
     |  SSE updates             |                             |
     |<------------------------------------------------------|
     |                          |                             |
     |  fetch /api/content/*    |  evaluateAll(context)       |
     |------------------------->|---------------------------->|
     |  JSON response           |  flag results               |
     |<-------------------------|<----------------------------|
```

## Prerequisites

- Node.js 20+ (LTS)
- pnpm 10+ or 11+
- Docker (for PostgreSQL and Redis)

## Quick Start

### 1. Install dependencies

```bash
pnpm install
```

### 2. Start infrastructure

```bash
pnpm run db:up
```

This starts PostgreSQL 18 and Redis 8 via Docker Compose.

### 3. Initialize the database

```bash
pnpm --filter backend auth:generate
pnpm --filter backend db:push
pnpm --filter backend db:seed
```

`auth:generate` creates the Better Auth schema file. `db:push` synchronizes all table schemas to the database. `db:seed` populates the database with a test organization, project, environments, SDK keys, and seven demo feature flags.

### 4. Start the backend and dashboard

```bash
pnpm dev:backend     # http://localhost:9000
```

In a separate terminal:

```bash
pnpm dev:frontend    # http://localhost:3000
```

### 5. Start the demo applications

Terminal 3 - Demo Express server:

```bash
pnpm --filter demo-server dev    # http://localhost:3002
```

Terminal 4 - Demo React client:

```bash
pnpm --filter demo-client dev    # http://localhost:3001
```

Or start all apps at once:

```bash
pnpm dev
```

## Demo Credentials

After running `db:seed`, the following accounts and keys are available:

**Dashboard login:**

| Field | Value |
|---|---|
| Email | `dev@flagix.com` |
| Password | `password123` |

**SDK keys (Development environment):**

| Type | Key |
|---|---|
| Client | `sdk_client_devkey123abcdefghijklmnopqrstuv` |
| Server | `sdk_server_devkey123abcdefghijklmnopqrstuv` |

## Demo Walkthrough

### Client-side evaluation (React SDK)

The demo client at `http://localhost:3001` shows a SaaS landing page controlled by feature flags. Two flags are evaluated directly by the React SDK:

| Flag Key | Type | Description |
|---|---|---|
| `dark-mode` | Boolean | Toggles dark/light theme across the entire UI |
| `theme-color` | Multivariate | Switches accent color among `light-blue`, `dark-slate`, `rose` |

Open the Context Controller (floating button, bottom-right) to switch between user personas. Each persona has a different `EvaluationContext` that affects which flag variations they receive.

When `dark-mode` is toggled in the Flagix dashboard, the demo client receives an SSE event and applies the theme change instantly - no page reload required.

### Server-side evaluation (Express BFF)

The demo server at `http://localhost:3002` demonstrates how a backend application evaluates flags using `@flagix/sdk-core` in stateless mode. Instead of caching, each HTTP request evaluates flags fresh for the given context.

**API endpoints:**

```
GET /api/health
GET /api/flags?context=<JSON>        # Evaluate all flags
GET /api/flags/:key?context=<JSON>   # Evaluate a single flag
GET /api/content/hero?context=<JSON> # Hero section (canary release + A/B test + promo)
GET /api/content/features?context=<JSON> # Feature list (tier gating + kill switch + beta)
GET /api/content/pricing?context=<JSON>  # Pricing table (A/B test layout)
```

**Server-side flags:**

| Flag Key | Type | Rule | Scenario |
|---|---|---|---|
| `hero-headline` | Multivariate | User targeting: `team=platform` | A/B tests hero messaging across dev, ops, and growth audiences |
| `new-homepage` | Boolean | Percentage rollout: 50% | Canary release of a new homepage layout |
| `pricing-hero` | Boolean | User targeting: `plan=enterprise` | A/B tests pricing page layout for enterprise users |
| `promo-banner` | Boolean | User targeting: `plan=free` | Promotional banner targeting free-tier users |
| `beta-analytics` | Boolean | User targeting: `betaAccess=true` | Kill switch for a beta analytics feature |

### Consistency verification

The demo client includes a ServerEvalPanel section that fetches flag evaluations from the Express server and compares them side-by-side with the React SDK results. All flags should match, confirming that Flagix evaluates consistently regardless of which SDK (client or server) performs the evaluation.

## Project Structure Reference

```
flagix/
  AGENTS.md                  AI agent guidelines (HeroUI v3 + Phosphor Icons)
  package.json               Root workspace config
  pnpm-workspace.yaml        Workspace package paths
  turbo.json                 Turborepo task pipeline
  tsconfig.base.json         Shared TypeScript config
  apps/
    backend/                 NestJS 11 API
      src/
        modules/             Feature modules (auth, flags, rules, evaluation, etc.)
        common/              Guards, decorators, filters, interceptors
        db/                  Drizzle ORM schema and seed data
    frontend/                React 19 admin dashboard
      src/
        components/          Reusable UI components
        features/            Feature modules (flags, projects, keys, audit, etc.)
        routes/              TanStack Router file-based routes
        lib/                 API client, auth, utilities
        stores/              Zustand stores
    demo/
      client/                React SPA (landing page demo)
        src/
          components/        Hero, Pricing, Features, PromoBanner, BetaAnalytics, ServerEvalPanel
          lib/               Constants, flag keys, context presets
      server/                Express.js BFF demo
        src/
          routes/            Health, flags, and content API endpoints
          middleware/         EvaluationContext extraction from query params
  packages/
    sdk-core/                @flagix/sdk-core - FlagixClient with SSE, cache, stateless evaluation
    sdk-react/               @flagix/sdk-react - FlagixProvider, useFlag, useFlags hooks
    shared/                  @flagix/shared - Zod schemas, types, constants
  infra/
    docker/                  docker-compose.infra.yml (PostgreSQL 18 + Redis 8)
```

## Package Scripts

```bash
pnpm dev                 # Start all apps via Turborepo
pnpm dev:backend         # Start NestJS backend (port 9000)
pnpm dev:frontend        # Start React dashboard (port 3000)
pnpm build               # Build all packages and apps
pnpm --filter demo-server dev   # Start Express demo server (port 3002)
pnpm --filter demo-client dev   # Start React demo client (port 3001)
pnpm run db:up           # Start PostgreSQL and Redis
pnpm run db:down         # Stop PostgreSQL and Redis
pnpm run db:logs         # Tail PostgreSQL logs
```

## Testing

```bash
pnpm --filter backend test
pnpm --filter @flagix/sdk-core test run
pnpm --filter @flagix/sdk-react test run
```

## Tech Stack

| Component | Technology |
|---|---|
| Backend framework | NestJS 11 |
| ORM | Drizzle ORM |
| Database | PostgreSQL 18 (Alpine) |
| Cache / Queue | Redis 8 (Alpine) + BullMQ v5 |
| Auth | Better Auth |
| Frontend framework | React 19 |
| Build tool | Vite 8 |
| Router | TanStack Router + TanStack Start |
| Data fetching | TanStack Query + ky |
| UI library | HeroUI v3 (React Aria) |
| Styling | Tailwind CSS v4 |
| State | Zustand v5 |
| Forms | React Hook Form + Zod v4 |
| Charts | Recharts v3 |
| Package manager | pnpm |
| Monorepo | Turborepo |
| Language | TypeScript (strict mode) |
