# Implementation Plan: Evaluation Analytics & Real-time Monitoring

**Branch**: `004-evaluation-analytics` | **Date**: 2026-07-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-evaluation-analytics/spec.md`

## Summary

Add evaluation event capture, storage, aggregation, and visualization to the Flagix platform. Every flag evaluation is recorded asynchronously via BullMQ + Redis, batch-inserted into PostgreSQL partition tables, pre-aggregated into hourly/daily statistical buckets, and surfaced through a real-time analytics dashboard with SSE streaming, Recharts visualizations, per-flag drill-down, and organization-level KPIs.

## Technical Context

**Language/Version**: TypeScript (Strict Mode)

**Primary Dependencies**: NestJS v11, Drizzle ORM v0.45, BullMQ, ioredis, PostgreSQL 18, React v19, Vite v8, TanStack Query, TanStack Router, Recharts, HeroUI v3, TailwindCSS v4, Phosphor Icons, SSE (RxJS Observables)

**Storage**: PostgreSQL 18 (table partitioning by month), Redis v7 (BullMQ queue + SSE pub/sub)

**Testing**: Vitest (frontend), Jest (backend)

**Target Platform**: Web Browser (Responsive Admin Dashboard)

**Project Type**: Full-stack analytics pipeline + dashboard UI

**Performance Goals**:
- Evaluation API P99 latency unchanged (< 10ms) — event recording is fire-and-forget
- BullMQ worker batch insert: 500 events in < 50ms
- SSE end-to-end latency: < 1s from evaluate response to dashboard update
- Analytics page load: < 2s for any time range (using pre-aggregated stats)
- Organization overview: < 3s with 500 flags / 90 days of history

**Constraints**:
- SHA-256 hashing for `userId` and `clientIp` with per-organization salt (GDPR compliance)
- Non-blocking write path — evaluation service never waits for event recording
- Batch inserts only (no single-row inserts) to sustain > 1000 req/s
- Redis required as BullMQ backing store and SSE pub/sub transport
- PostgreSQL table partitioning by month, BRIN indexes for time-range queries
- Configurable retention: raw events 30 days, hourly stats 90 days, daily stats 2 years

**Scale/Scope**:
- Throughput: > 1000 evaluation requests/second
- Data volume: ~86M raw events/day at peak (partition + batch insert handles this)
- Dashboard: up to 500 active flags per organization, up to 10 environments per project

## Constitution Check

*GATE: Passed*

- **Monorepo**: New backend modules (`evaluation-events`, `evaluation-collector`, `evaluation-analytics`, `evaluation-aggregator`, `evaluation-stream`) follow existing NestJS module conventions in `apps/backend/src/modules/`.
- **Tech Stack**: Uses existing NestJS + Drizzle + PostgreSQL + React + TanStack Query + HeroUI base. New additions: BullMQ, ioredis, Recharts — all curated, production-grade libraries.
- **Version Accuracy & Research**: BullMQ v5 API, Recharts v2 API, Drizzle ORM v0.45 table partitioning patterns — all to be validated against official docs during implementation.
- **Separation of Concerns**: Evaluation engine (`evaluation.engine.ts`) and service (`evaluation.service.ts`) are NOT modified. Collection happens at the controller layer via a dedicated `EvaluationCollectorService`.
- **Fail-Safe**: BullMQ with Redis persistence ensures zero event loss on API server restart. Workers implement exponential backoff retry. Evaluation hot path is completely isolated from the analytics write path.
- **Multi-Tenant Isolation**: All analytics queries scoped by `organizationId` from the authenticated session/session key. No cross-org data leakage.
- **Validation**: Analytics API request validation via shared Zod schemas and NestJS class-validator DTOs.

## Project Structure

### Documentation (this feature)

```text
specs/004-evaluation-analytics/
├── plan.md              # This file
├── spec.md              # Feature specification
├── data-model.md        # Database entities
├── tasks.md             # Implementation task list
├── contracts/           # API contracts
│   └── api-contracts.md
└── checklists/          # Quality checklists
    └── requirements.md
```

### Source Code (repository root)

```text
apps/backend/src/
├── modules/
│   ├── evaluation/              # EXISTING — no changes to engine/service
│   │   ├── evaluation.controller.ts   # ADD: inject EvaluationCollector
│   │   ├── evaluation.service.ts      # NO CHANGE
│   │   └── evaluation.engine.ts       # NO CHANGE
│   ├── evaluation-events/       # NEW — Drizzle schema + repository
│   │   ├── evaluation-events.module.ts
│   │   ├── evaluation-events.repository.ts
│   │   └── evaluation-events.schema.ts
│   ├── evaluation-collector/    # NEW — BullMQ producer
│   │   ├── evaluation-collector.module.ts
│   │   ├── evaluation-collector.service.ts
│   │   └── evaluation-collector.worker.ts
│   ├── evaluation-analytics/    # NEW — Read API endpoints
│   │   ├── evaluation-analytics.module.ts
│   │   ├── evaluation-analytics.controller.ts
│   │   └── evaluation-analytics.service.ts
│   ├── evaluation-aggregator/   # NEW — Cron jobs for rollups + purge
│   │   ├── evaluation-aggregator.module.ts
│   │   └── evaluation-aggregator.service.ts
│   └── evaluation-stream/       # NEW — SSE real-time publisher
│       ├── evaluation-stream.module.ts
│       ├── evaluation-stream.controller.ts
│       └── evaluation-stream.service.ts
├── db/schema/
│   ├── evaluation-events.ts     # NEW — table definition
│   └── evaluation-stats.ts      # NEW — stats_hourly + stats_daily
├── common/decorators/
│   └── sdk-environment.decorator.ts  # MODIFY: add sdkKeyId
├── common/guards/
│   └── sdk-key.guard.ts         # MODIFY: pass sdkKeyId in request

apps/frontend/
├── src/
│   ├── features/
│   │   └── analytics/           # NEW — analytics feature module
│   │       ├── components/
│   │       │   ├── AnalyticsOverview.tsx
│   │       │   ├── FlagAnalytics.tsx
│   │       │   ├── LiveStream.tsx
│   │       │   ├── EvaluationTrendChart.tsx
│   │       │   ├── VariationDistributionChart.tsx
│   │       │   ├── EnvironmentComparisonChart.tsx
│   │       │   └── MetricCard.tsx
│   │       ├── hooks/
│   │       │   ├── useAnalyticsOverview.ts
│   │       │   ├── useFlagAnalytics.ts
│   │       │   └── useAnalyticsStream.ts
│   │       └── types/
│   │           └── analytics.ts
│   └── routes/
│       └── __root/
│           └── organizations/
│               └── $orgId/
│                   └── analytics/
│                       ├── index.tsx        # Overview page
│                       ├── flags/
│                       │   └── $flagId.tsx  # Per-flag detail
│                       └── environments.tsx  # Environment comparison

infra/docker/
└── docker-compose.yml           # MODIFY: add Redis service
```

**Structure Decision**: Backend modules follow the existing NestJS convention (one module per responsibility). Frontend uses the existing feature-based structure with `features/analytics/` for self-contained UI logic. Analytics routes are nested under the organization route to inherit the auth/organization context.

## Complexity Tracking

N/A - No violations of the constitution. BullMQ + Redis addition is justified by the > 1000 req/s throughput requirement and is the standard queue solution in the Node.js ecosystem.
