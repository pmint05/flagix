---
description: "Task list for feature implementation: Evaluation Analytics & Real-time Monitoring"
---

# Tasks: Evaluation Analytics & Real-time Monitoring

**Input**: Design documents from `specs/004-evaluation-analytics/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/api-contracts.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Infrastructure)

**Purpose**: Add project dependencies and infrastructure changes

- [ ] T001 Add Redis service with healthcheck to `infra/docker/docker-compose.yml` (image: redis:7-alpine, container: flagix_redis, port 6379, volume for persistence)
- [ ] T002 [P] Add BullMQ and ioredis dependencies to `apps/backend/package.json` (`bullmq`, `ioredis`)
- [ ] T003 [P] Add Recharts dependency to `apps/frontend/package.json` (`recharts`)
- [ ] T004 [P] Add `EVALUATION_USER_HASH_SALT` environment variable with a generated random 64-char hex value to backend `.env.example` and frontend `.env.example`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema, BullMQ infrastructure, and shared backend modules that MUST be complete before ANY user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 Create `evaluation_events` Drizzle schema with monthly partitioning in `apps/backend/src/db/schema/evaluation-events.ts` (bigserial PK, FKs, BRIN + B-tree indexes, partition DDL via raw SQL migration)
- [ ] T006 [P] Create `evaluation_stats` Drizzle schema in `apps/backend/src/db/schema/evaluation-stats.ts` (evaluation_stats_hourly with UNIQUE constraint, evaluation_stats_daily with UNIQUE constraint)
- [ ] T007 [P] Generate and run Drizzle migration for new tables and partitions in `apps/backend/drizzle/`
- [ ] T008 Create `EvaluationEventsModule` with `EvaluationEventsRepository` (batch insert via `db.insert().values()`) in `apps/backend/src/modules/evaluation-events/`
- [ ] T009 [P] Create `BullMQModule` with Redis connection provider (ioredis client, `Queue` and `Worker` factories) in `apps/backend/src/modules/bullmq/bullmq.module.ts`
- [ ] T010 Extend `SdkEnvironmentInfo` interface to include `sdkKeyId` in `apps/backend/src/common/decorators/sdk-environment.decorator.ts`
- [ ] T011 [P] Modify `SdkKeyGuard` to set `sdkKeyId` on `request.sdkEnvironment` in `apps/backend/src/common/guards/sdk-key.guard.ts` (line 80, add `sdkKeyId: sdkKey.id` to the request assignment)

**Checkpoint**: Foundation ready — database has partitioned events table, BullMQ is connected to Redis, SDK key guard provides all needed metadata. User story implementation can now begin in parallel.

---

## Phase 3: User Story 1 - Real-time Flag Evaluation Monitoring (Priority: P1) 🎯 MVP

**Goal**: As a platform operator, I need to see real-time evaluation activity so that I can detect anomalies and verify feature rollouts.

**Independent Test**: Send 1000 evaluate requests. Verify events are enqueued, batch-inserted into PostgreSQL, and streamed via SSE in < 1 second without impacting API latency.

### Implementation for User Story 1

- [ ] T012 [P] [US1] Create `EvaluationCollectorService` that enqueues evaluation events to BullMQ queue in `apps/backend/src/modules/evaluation-collector/evaluation-collector.service.ts` (hashing userId/clientIp with salt, fire-and-forget pattern)
- [ ] T013 [P] [US1] Create `EvaluationCollectorWorker` with batch insert logic in `apps/backend/src/modules/evaluation-collector/evaluation-collector.worker.ts` (buffer 500 events or 100ms, `insertMany`, exponential backoff retry 3x)
- [ ] T014 [P] [US1] Create `EvaluationCollectorModule` registering both service and worker in `apps/backend/src/modules/evaluation-collector/evaluation-collector.module.ts`
- [ ] T015 [US1] Wire `EvaluationCollectorService.record()` into `EvaluationController.evaluate()` at `apps/backend/src/modules/evaluation/evaluation.controller.ts:33` (call after service returns, log but don't throw on failure)
- [ ] T016 [P] [US1] Wire `EvaluationCollectorService.record()` into `EvaluationController.evaluateAll()` at `apps/backend/src/modules/evaluation/evaluation.controller.ts:47` (call per-flag result after mapping)
- [ ] T017 [P] [US1] Create `EvaluationStreamService` with Redis pub/sub per-organization channel in `apps/backend/src/modules/evaluation-stream/evaluation-stream.service.ts` (publish from worker after batch insert, subscribe for SSE)
- [ ] T018 [US1] Create `EvaluationStreamController` with SSE endpoint GET `/organizations/:orgId/analytics/stream` in `apps/backend/src/modules/evaluation-stream/evaluation-stream.controller.ts` (follows flag-changes SSE pattern, optional flagKey/envId filter, 10Hz batch, heartbeat every 5s)
- [ ] T019 [P] [US1] Create `EvaluationStreamModule` in `apps/backend/src/modules/evaluation-stream/evaluation-stream.module.ts`

**Checkpoint**: Evaluation events are being captured, batch-inserted, and streamed via SSE. Operator can open the SSE endpoint and see real-time evaluation events.

---

## Phase 4: User Story 2 - Per-Flag Analytics Dashboard (Priority: P1) 🎯 MVP

**Goal**: As a product manager, I want to drill into a specific flag and see its evaluation history, variation distribution, and environment breakdown.

**Independent Test**: Create a multivariate flag with percentage rollout. Send 1000 evaluations. Open flag analytics page. Verify time series, variation distribution (within 5% tolerance), and environment filter.

### Implementation for User Story 2

- [ ] T020 [US2] Create `EvaluationAnalyticsService` with `getFlagAnalytics()` query in `apps/backend/src/modules/evaluation-analytics/evaluation-analytics.service.ts` (auto-select raw events vs hourly stats based on time range, join variations for color/name)
- [ ] T021 [P] [US2] Add `getFlagEnvironmentDetail()` method to `EvaluationAnalyticsService` for single flag × single env drill-down
- [ ] T022 [US2] Create `EvaluationAnalyticsController` with `GET /organizations/:orgId/analytics/flags/:flagId` and `GET /organizations/:orgId/analytics/flags/:flagId/environments/:envId` in `apps/backend/src/modules/evaluation-analytics/evaluation-analytics.controller.ts`
- [ ] T023 [US2] Create `EvaluationAnalyticsModule` in `apps/backend/src/modules/evaluation-analytics/evaluation-analytics.module.ts`
- [ ] T024 [P] [US2] Create `useFlagAnalytics` TanStack Query hook in `apps/frontend/src/features/analytics/hooks/useFlagAnalytics.ts` (query key: [orgId, 'flag-analytics', flagId, timeRange, envId])
- [ ] T025 [P] [US2] Create `VariationDistributionChart` component (Recharts PieChart with custom labels showing percentage) in `apps/frontend/src/features/analytics/components/VariationDistributionChart.tsx`
- [ ] T026 [P] [US2] Create `EvaluationTrendChart` component (Recharts AreaChart with stacked variation series, time X-axis) in `apps/frontend/src/features/analytics/components/EvaluationTrendChart.tsx`
- [ ] T027 [US2] Create `FlagAnalytics` page component composing KPIs + charts + env selector + time range in `apps/frontend/src/features/analytics/components/FlagAnalytics.tsx`
- [ ] T028 [US2] Create route `/organizations/$orgId/analytics/flags/$flagId.tsx` mounting `FlagAnalytics` component in `apps/frontend/src/routes/__root/organizations/$orgId/analytics/flags/`
- [ ] T029 [US2] Add analytics link/navigation from flag detail page to flag analytics page (add button in existing flag detail component)

**Checkpoint**: Per-flag analytics page is fully functional — time series, variation distribution, environment filter, time range selector all work with data from the backend.

---

## Phase 5: User Story 3 - Organization-level Analytics Overview (Priority: P2)

**Goal**: As an organization admin, I want a high-level analytics overview with KPIs, top flags, and environment comparison.

**Independent Test**: Create 5 flags across 2 projects/3 envs. Send varied evaluation volumes. Verify KPIs, top 5 flags ranking, and environment breakdown.

### Implementation for User Story 3

- [ ] T030 [US3] Add `getOverview()` method to `EvaluationAnalyticsService` in `apps/backend/src/modules/evaluation-analytics/evaluation-analytics.service.ts` (total evals, unique users from `approx_count_distinct`, error rate, active flags, top 10 flags, by-environment breakdown)
- [ ] T031 [P] [US3] Add `GET /organizations/:orgId/analytics/overview` endpoint to `EvaluationAnalyticsController`
- [ ] T032 [P] [US3] Add `GET /organizations/:orgId/analytics/environments/:envId` endpoint to `EvaluationAnalyticsController`
- [ ] T033 [P] [US3] Create `useAnalyticsOverview` TanStack Query hook in `apps/frontend/src/features/analytics/hooks/useAnalyticsOverview.ts`
- [ ] T034 [P] [US3] Create `MetricCard` component (KPI card with label, value, delta indicator, optional icon) in `apps/frontend/src/features/analytics/components/MetricCard.tsx`
- [ ] T035 [P] [US3] Create `EnvironmentComparisonChart` component (Recharts BarChart with grouped bars per env) in `apps/frontend/src/features/analytics/components/EnvironmentComparisonChart.tsx`
- [ ] T036 [US3] Create `AnalyticsOverview` page component composing MetricCards + top flags table + env chart in `apps/frontend/src/features/analytics/components/AnalyticsOverview.tsx`
- [ ] T037 [US3] Create route `/organizations/$orgId/analytics/index.tsx` mounting `AnalyticsOverview` in `apps/frontend/src/routes/__root/organizations/$orgId/analytics/`
- [ ] T038 [US3] Add "Analytics" item to the existing sidebar navigation in the dashboard shell (icon: ChartBarIcon from Phosphor, link to analytics overview)

**Checkpoint**: Organization analytics overview page is functional — KPIs, top flags table, environment comparison chart all work.

---

## Phase 6: User Story 4 - Real-time Streaming Dashboard (Priority: P2)

**Goal**: As an operator, I want a live streaming dashboard showing evaluation events as they happen during critical deployments.

**Independent Test**: Open live stream. Send 100 evaluate requests. Verify all events appear within 1s, correctly labeled with flag, variation, env, and reason.

### Implementation for User Story 4

- [ ] T039 [P] [US4] Create `useAnalyticsStream` hook using EventSource API with auto-reconnect in `apps/frontend/src/features/analytics/hooks/useAnalyticsStream.ts` (connect to `/analytics/stream`, buffer events, expose last N events as state)
- [ ] T040 [US4] Create `LiveStream` component (virtualized event feed with flagKey, variationKey, env name, reason, timestamp, pause/resume button, flag key filter input) in `apps/frontend/src/features/analytics/components/LiveStream.tsx`
- [ ] T041 [US4] Create route `/organizations/$orgId/analytics/live.tsx` mounting `LiveStream` in `apps/frontend/src/routes/__root/organizations/$orgId/analytics/`
- [ ] T042 [US4] Add "Live Stream" link to analytics sidebar sub-navigation or tab within analytics section

**Checkpoint**: Live streaming page shows real-time evaluation events. Pause, resume, and filter by flag key all work.

---

## Phase 7: User Story 5 - Data Retention & Lifecycle (Priority: P3)

**Goal**: As a platform administrator, I need evaluation data to be automatically managed — raw events purged, stats rolled up — so storage remains predictable.

**Independent Test**: Insert events spanning 35 days. Run purge cron. Verify events older than 30 days are deleted, partition dropped, hourly stats remain.

### Implementation for User Story 5

- [x] T043 [P] [US5] Create `EvaluationAggregatorService` with `@Cron('0 * * * *')` hourly aggregation job in `apps/backend/src/modules/evaluation-aggregator/evaluation-aggregator.service.ts` (INSERT ... ON CONFLICT UPDATE from raw events to hourly stats)
- [x] T044 [P] [US5] Add daily rollup job (`@Cron('0 2 * * *')`) to `EvaluationAggregatorService` (aggregate hourly → daily stats for data > 90 days)
- [x] T045 [P] [US5] Add purge job (`@Cron('0 3 * * *')`) to `EvaluationAggregatorService` (DELETE raw events older than `EVALUATION_EVENT_RETENTION_DAYS`, DROP orphaned monthly partitions)
- [x] T046 [P] [US5] Add manual partition creation job (`@Cron('0 0 1 * *')`) to `EvaluationAggregatorService` (CREATE next-month partition on the 1st of each month)
- [x] T047 [US5] Create `EvaluationAggregatorModule` in `apps/backend/src/modules/evaluation-aggregator/evaluation-aggregator.module.ts`

**Checkpoint**: Data lifecycle is fully automated — events are purged, stats are rolled up, partitions are managed.

---

## Phase 8: Polish & Cross-Cutting Concerns (Priority: P2)

**Purpose**: Time range selector, error handling, loading states, and responsive design across all analytics pages

- [x] T048 [P] Create reusable `TimeRangeSelector` component (preset buttons: 1h, 24h, 7d, 30d, 90d + custom range picker using HeroUI DatePicker) in `apps/frontend/src/features/analytics/components/TimeRangeSelector.tsx`
- [x] T049 [P] Add loading skeleton states (HeroUI Skeleton) to all analytics components (overview, flag detail, live stream)
- [x] T050 [P] Add error state handling with retry button to all analytics pages (TanStack Query error + HeroUI Button)
- [x] T051 [P] Add empty state (no evaluation data yet) with illustration and "Learn about evaluations" link to all analytics pages
- [x] T052 [P] Add responsive design pass for all analytics pages (mobile: single column, tablet: 2-column grid, desktop: full layout)
- [x] T053 Configure rate limiting for analytics SSE endpoint using `@nestjs/throttler` (separate limit: 100 connections per user per 60s)
- [x] T054 [P] Add `hashUtil.ts` with SHA-256 helpers (hashUserId, hashClientIp) in `apps/backend/src/common/utils/hash.util.ts`
- [x] T055 [P] Create shared Zod schemas for analytics requests (timeRange, granularity) in `packages/shared/src/schemas/analytics.ts`
- [x] T056 Create `analytics.ts` frontend types mirroring API response shapes in `apps/frontend/src/features/analytics/types/analytics.ts`

---

## Phase 9: Testing (Priority: P2)

**Purpose**: Unit and integration tests for critical paths

- [x] T057 [P] Unit test `EvaluationCollectorService` — verify event hashing, queue enqueue, error handling in `apps/backend/src/modules/evaluation-collector/*.spec.ts`
- [x] T058 [P] Unit test `EvaluationCollectorWorker` — verify batch insert, buffer flush, retry logic in `apps/backend/src/modules/evaluation-collector/*.spec.ts`
- [ ] T059 [P] Unit test `EvaluationAnalyticsService` — verify query routing (raw vs hourly vs daily), correct aggregation SQL in `apps/backend/src/modules/evaluation-analytics/*.spec.ts`
- [ ] T060 [P] Unit test `EvaluationAggregatorService` — verify hourly aggregation, daily rollup, purge correctness in `apps/backend/src/modules/evaluation-aggregator/*.spec.ts`
- [ ] T061 [P] Integration test for evaluation → collect → worker → insert pipeline (seed DB, call evaluate, wait for worker, assert events in DB)
- [ ] T062 [P] Integration test for SSE streaming (seed events, connect SSE client, assert events received)
- [ ] T063 [P] Frontend unit test `MetricCard` component rendering (all variations: number, percentage, loading, error)
- [ ] T064 [P] Frontend unit test `VariationDistributionChart` with mock data
- [ ] T065 [P] Frontend unit test `EvaluationTrendChart` with mock time series data

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies. Can start immediately.
- **Foundational (Phase 2)**: Depends on Setup (Phase 1). BLOCKS all user stories (Phase 3-7).
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2). Required for US4 (streaming).
- **User Story 2 (Phase 4)**: Depends on Foundational (Phase 2). Independent of US1.
- **User Story 3 (Phase 5)**: Depends on Foundational (Phase 2). Benefits from US2 (reuses analytics service queries).
- **User Story 4 (Phase 6)**: Depends on Phase 3 (needs SSE infrastructure from US1).
- **User Story 5 (Phase 7)**: Depends on Foundational (Phase 2). Independent of US1-4.
- **Polish (Phase 8)**: Depends on Phase 3, 4, 5, 6 (needs all pages to exist).
- **Testing (Phase 9)**: Can be done in parallel with any phase after the corresponding code exists.

### Parallel Opportunities

- T001-T004 can run in parallel (Phase 1)
- T005-T008 can run in parallel (Phase 2)
- T020 (backend service) and T024-T026 (frontend components) can run in parallel within Phase 4
- Phase 3 (US1) and Phase 4 (US2) can be developed in parallel after Phase 2
- Phase 5 (US3) and Phase 7 (US5) can be developed in parallel after Phase 2
- T057-T065 (all tests) can run in parallel within Phase 9

---

## Implementation Strategy

### MVP First (User Story 1 + 2 + 3)

1. Complete Phase 1 + 2 (infrastructure + schema)
2. Complete Phase 3 (event capture + SSE — the data pipeline)
3. Complete Phase 4 (per-flag analytics — the core dashboard)
4. Complete Phase 5 (organization overview — strategic visibility)
5. **STOP and VALIDATE**: Deploy and verify the full pipeline works end-to-end with real SDK traffic

### Incremental Delivery

1. **Milestone 1** (Phase 1-3): Data pipeline is live — events being captured, visible via SSE. No UI yet but data integrity can be verified via DB queries and SSE endpoint.
2. **Milestone 2** (Phase 4): Per-flag analytics page is shippable. This alone provides immediate value — developers can see how their flags are being evaluated.
3. **Milestone 3** (Phase 5): Org overview gives management visibility. Combine with per-flag detail for a complete analytics product.
4. **Milestone 4** (Phase 6-9): Live streaming, data lifecycle, polish, and tests — production hardening.
