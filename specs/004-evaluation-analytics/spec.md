# Feature Specification: Evaluation Analytics & Real-time Monitoring

**Feature Branch**: `004-evaluation-analytics`

**Created**: 2026-07-02

**Status**: Draft

**Input**: User description: "Integrate evaluation history logging for monitoring, dashboard, and statistics — per flag, per environment, with variation resolution counts and real-time streaming."

## Clarifications

### Session 2026-07-02

- Q: Expected evaluation throughput? → A: >1000 requests/second, needs message queue for reliable buffering.
- Q: Real-time or near-real-time monitoring? → A: Real-time (< 1s latency), use SSE streaming.
- Q: Store user identity in evaluation events? → A: Yes, but SHA-256 hashed for GDPR/privacy compliance.
- Q: Integration scope? → A: New spec 004, separate from 003-dashboard-ui-integration.
- Q: Frontend chart library? → A: Recharts (lightweight, declarative, React-native).
- Q: Redis dependency for BullMQ? → A: Yes, add Redis to docker-compose.yml infrastructure.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Real-time Flag Evaluation Monitoring (Priority: P1) 🎯 MVP

As a platform operator, I need to see real-time evaluation activity across all flags in my organization so that I can detect anomalies, monitor feature rollout velocity, and verify that flag configurations are behaving as expected immediately after deployment.

**Why this priority**: Without real-time visibility, operators are blind to how flags are being evaluated in production. This is the foundational building block — all other analytics features depend on evaluation events being captured.

**Independent Test**: Deploy the system with evaluation event collection enabled. Send 1000 evaluate requests to `/api/v1/evaluate`. Open the analytics dashboard and confirm that evaluation counts appear in real-time (< 1s) via the SSE stream, showing correct flag key, variation key, and evaluation reason.

**Acceptance Scenarios**:

1. **Given** a flag is being evaluated in production, **When** an SDK calls `/api/v1/evaluate`, **Then** the evaluation event is enqueued to BullMQ within 1ms and the API response is not delayed.
2. **Given** evaluation events are flowing through BullMQ, **When** a batch of 500 events accumulates, **Then** the worker batch-inserts them into `evaluation_events` table in a single query.
3. **Given** an analytics dashboard is open, **When** new evaluation events are processed, **Then** the dashboard updates counters via SSE in < 1 second.
4. **Given** the BullMQ worker is down for 30 seconds, **When** it recovers, **Then** all queued events are processed without data loss.

---

### User Story 2 - Per-Flag Analytics Dashboard (Priority: P1) 🎯 MVP

As a product manager or developer, I want to drill into a specific feature flag and see its evaluation history over time, variation distribution, and breakdown by environment so that I can understand rollout progress, verify targeting rules, and make data-driven decisions about flag lifecycle.

**Why this priority**: This is the primary use case for analytics — understanding how a specific flag performs. Combined with US1, this completes the MVP analytics experience.

**Independent Test**: Create a multivariate flag with 3 variations (A, B, C) and a percentage rollout rule (50% A, 30% B, 20% C). Send 1000 evaluate requests with randomized user IDs. Open the flag analytics page and verify: (a) total count ≈ 1000, (b) variation distribution within 5% of configured percentages, (c) time series chart shows evaluation volume over time, (d) environment selector filters correctly.

**Acceptance Scenarios**:

1. **Given** a flag has been evaluated across multiple environments, **When** I open the flag analytics page, **Then** I see evaluation count, variation distribution (pie chart), and time series (area chart) for the last 24 hours by default.
2. **Given** I am viewing flag analytics, **When** I select a different time range (7d, 30d, 90d), **Then** the charts update with aggregated data from `evaluation_stats_hourly`.
3. **Given** I am viewing flag analytics for a flag used in 3 environments, **When** I filter by a specific environment, **Then** all charts and counts reflect only that environment's data.
4. **Given** a flag has evaluation errors (FLAG_NOT_FOUND, EVALUATION_ERROR), **When** I view the analytics, **Then** errors are displayed separately with a distinguishable indicator (red accent).
5. **Given** I am viewing flag analytics, **When** real-time evaluations occur, **Then** the current-hour counters update in real-time via SSE without requiring a page refresh.

---

### User Story 3 - Organization-level Analytics Overview (Priority: P2)

As an organization admin, I want a high-level analytics overview dashboard showing total evaluation volume, top evaluated flags, error rates, and unique user counts across all projects and environments so that I can monitor platform health and identify trends at a glance.

**Why this priority**: Organization-level KPIs provide strategic visibility. This is important but can be built after the per-flag detail view since it depends on the same data pipeline.

**Independent Test**: Create 5 flags across 2 projects with 3 environments each. Send varying volumes of evaluation requests. Open the analytics overview and verify: (a) total evaluation count across all flags matches, (b) top 5 flags by volume are correct, (c) error rate percentage is accurate, (d) environment comparison shows relative volumes.

**Acceptance Scenarios**:

1. **Given** evaluation data exists across multiple projects and environments, **When** I open the organization analytics overview, **Then** I see KPI cards for total evaluations (24h), unique users (24h), error rate (%), and active flags count.
2. **Given** evaluation data exists, **When** the overview loads, **Then** a bar chart shows top 10 flags by evaluation volume for the selected time range.
3. **Given** evaluation data exists across environments, **When** I view the overview, **Then** a stacked bar chart shows evaluation volume per environment over time.
4. **Given** I am viewing the overview, **When** I change the time range selector, **Then** all KPIs and charts update accordingly.

---

### User Story 4 - Real-time Streaming Dashboard (Priority: P2)

As an operator monitoring a production deployment, I want a live streaming dashboard that shows evaluation events as they happen, including flag key, variation resolved, environment, and evaluation reason, so that I can watch rollouts in real-time during critical deployments.

**Why this priority**: Real-time streaming is a differentiated feature for production monitoring but can be built after the core analytics pipeline.

**Independent Test**: Open the live stream dashboard. Send 100 evaluate requests with known flag keys and variations. Verify that events appear in the stream within 1 second, correctly showing flag key, variation key, environment name, and evaluation reason, with the most recent events at the top.

**Acceptance Scenarios**:

1. **Given** the live stream dashboard is open, **When** evaluation events occur, **Then** each event appears as a row in the stream with flag key, variation key, environment, reason, and timestamp.
2. **Given** the live stream is receiving events, **When** I toggle a filter for a specific flag key, **Then** only events for that flag are displayed.
3. **Given** the live stream is receiving events at high volume (> 100/s), **When** events arrive faster than the UI can render, **Then** the stream batches updates at 10 Hz to prevent UI jank.
4. **Given** I pause the live stream, **When** new events arrive, **Then** they are queued and displayed when I resume.

---

### User Story 5 - Data Retention & Lifecycle Management (Priority: P3)

As a platform administrator, I need evaluation data to be automatically managed — raw events purged after a configurable retention period, hourly stats retained longer, and daily rollups for long-term trends — so that storage costs remain predictable and query performance stays fast.

**Why this priority**: This is operational infrastructure that prevents data accumulation issues. It can be deferred initially since storage won't be a problem for the first few months.

**Independent Test**: Insert evaluation events with timestamps spanning 35 days. Run the purge cron job. Verify: (a) events older than 30 days are deleted, (b) events within 30 days remain, (c) hourly stats older than 30 days still exist, (d) partition for the purged month is dropped.

**Acceptance Scenarios**:

1. **Given** `evaluation_events` has data older than the configured retention (default 30 days), **When** the daily purge cron runs, **Then** expired events are deleted and the corresponding table partition is dropped.
2. **Given** `evaluation_stats_hourly` has data up to 90 days old, **When** the daily rollup cron runs, **Then** hourly data older than 90 days is aggregated into daily buckets in `evaluation_stats_daily`.
3. **Given** retention configuration is changed via environment variable, **When** the next purge cycle runs, **Then** it respects the new retention period.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST capture every evaluation event (flag key, variation key, resolved value, evaluation reason, environment, project, organization) for successful and failed evaluations.
- **FR-002**: System MUST NOT add measurable latency to the evaluation API hot path — event recording must be fire-and-forget with < 1ms overhead in the request thread.
- **FR-003**: System MUST batch-insert evaluation events using BullMQ workers to sustain > 1000 req/s throughput without database contention.
- **FR-004**: System MUST hash `context.userId` using SHA-256 with a per-organization salt before storing, ensuring GDPR-friendly analytics without exposing raw user identifiers.
- **FR-005**: System MUST provide real-time evaluation event streaming via SSE for the dashboard, with < 1 second end-to-end latency.
- **FR-006**: System MUST pre-aggregate evaluation data into hourly statistical buckets (`evaluation_stats_hourly`) for fast dashboard queries on time ranges > 24 hours.
- **FR-007**: System MUST support drill-down analytics per flag including: total evaluation count, variation distribution (percentage per variation), time series (hourly/daily granularity), and breakdown by environment.
- **FR-008**: System MUST provide an organization-level analytics overview with total evaluations, unique users, error rate, top flags by volume, and environment comparison.
- **FR-009**: System MUST automatically purge raw evaluation events after a configurable retention period (default 30 days) via a scheduled cron job.
- **FR-010**: System MUST roll up hourly stats into daily stats for long-term retention (default 2 years) via a scheduled cron job.
- **FR-011**: All analytics API endpoints MUST be scoped to the authenticated organization and require an active user session.
- **FR-012**: The analytics dashboard MUST use Recharts for all chart visualizations (line, area, bar, pie/donut charts).
- **FR-013**: The `SdkEnvironment` decorator MUST be extended to include `sdkKeyId` so evaluation events can be traced back to specific SDK keys.
- **FR-014**: BullMQ workers MUST implement exponential backoff retry (3 attempts) for failed database inserts.

### Key Entities

- **EvaluationEvent**: A single flag evaluation occurrence with flag key, variation, reason, environment, context user hash, SDK key reference, client IP hash, and timestamp.
- **EvaluationStatsHourly**: Pre-aggregated hourly statistics grouping evaluation events by organization, flag, environment, variation, and reason, with total count and unique user count.
- **EvaluationStatsDaily**: Long-term daily rollup of hourly stats for historical trend analysis (retention: 2 years).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Evaluation API response time (P99) remains unchanged (< 10ms) after enabling event collection, since recording is fire-and-forget.
- **SC-002**: BullMQ worker processes batches of 500 events in < 50ms under normal conditions.
- **SC-003**: Real-time SSE events reach the dashboard in < 1 second from the moment the evaluation API returns.
- **SC-004**: Per-flag analytics page loads in < 2 seconds for any time range, including 90-day historical queries.
- **SC-005**: Organization overview page loads in < 3 seconds with up to 500 active flags and 90 days of history.
- **SC-006**: Variation distribution accuracy is within 1% of actual proportions when ≥ 100 evaluations have been performed.
- **SC-007**: Raw event purging does not impact API or dashboard performance (runs during low-traffic hours, 3 AM UTC).
- **SC-008**: Zero data loss during normal operations — BullMQ with Redis persistence ensures all queued events are processed even after API server restart.

## Assumptions

- Redis will be added to the project infrastructure (docker-compose.yml) for BullMQ backing store. No additional operational burden since Redis is already a common dependency in production deployments.
- The existing SSE infrastructure (`flag-changes` module, SSE controller pattern) can be extended for evaluation event streaming.
- `context.userId` is the only PII field captured; other context fields (role, attributes) are not stored in evaluation events.
- Salt for user ID hashing will be configured via environment variable `EVALUATION_USER_HASH_SALT` and must be kept secret.
- Default retention of 30 days for raw events is acceptable for most deployments; configurable via `EVALUATION_EVENT_RETENTION_DAYS`.
- PostgreSQL table partitioning by month is sufficient for the expected data volume; TimescaleDB migration path exists but is not in scope.
- The analytics dashboard reuses the existing layout shell, navigation, and auth context from 003-dashboard-ui-integration.
- Evaluation events are NOT captured when the system is in maintenance mode or when the database is unreachable (events are dropped to keep hot path responsive).

## Dependencies

- **BullMQ + Redis**: Required for reliable event buffering at > 1000 req/s.
- **Recharts**: Frontend chart library; must be added to `apps/frontend/package.json`.
- **003-dashboard-ui-integration**: Analytics dashboard reuses auth, layout, navigation, and TanStack Query infrastructure.
- **PostgreSQL 15+**: Table partitioning requires PostgreSQL 15+ (already satisfied by current postgres:18-alpine).
- **Existing SSE infrastructure**: `flag-changes` module provides the SSE pattern to follow.

## Out of Scope

- Custom chart builder or dashboard designer — charts are fixed templates.
- Alerting/notification rules based on evaluation thresholds (e.g., "notify me when error rate > 5%") — this is a separate feature.
- Evaluation event export (CSV/JSON download) — can be added later.
- A/B test statistical analysis (p-value, confidence intervals) — evaluation data collection supports this but analysis is out of scope.
- Real-time collaborative features on the analytics dashboard.
- TimescaleDB / ClickHouse migration — PostgreSQL partitioning is the target.
- Capturing evaluation latency/timing data — only the evaluation result is captured, not performance metrics.
- SDK-side evaluation event collection — only server-side evaluations are captured.
