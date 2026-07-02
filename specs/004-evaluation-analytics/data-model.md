# Data Model

Extracted entities for the Evaluation Analytics & Real-time Monitoring feature:

## EvaluationEvent

- Fields: `id` (bigserial PK), `organizationId` (uuid FK → organizations), `projectId` (uuid FK → projects), `environmentId` (uuid FK → environments), `featureFlagId` (uuid FK → feature_flags, nullable for not-found flags), `flagKey` (text, denormalized for fast queries), `variationId` (uuid FK → variations, nullable for errors), `variationKey` (text), `resolvedValue` (jsonb), `evaluationReason` (text enum), `contextUserHash` (text nullable, SHA-256), `sdkKeyId` (uuid FK → sdk_keys, nullable), `clientIpHash` (text nullable, SHA-256), `createdAt` (timestamptz, default NOW())
- Relationships: Belongs to Organization, Project, Environment. Optionally belongs to FeatureFlag, Variation, SdkKey.
- Rules:
  - Partitioned by `createdAt` (RANGE, monthly partitions named `evaluation_events_YYYY_MM`)
  - BRIN index on `(organization_id, created_at DESC)` for time-range scans
  - B-tree index on `(environment_id, flag_key, created_at DESC)` for per-flag drill-down
  - `flagKey` is denormalized to allow querying events even after the flag is deleted
  - `contextUserHash` = SHA-256(`userId` + `EVALUATION_USER_HASH_SALT`) — raw user ID never stored
  - `clientIpHash` = SHA-256(`clientIp` + `EVALUATION_USER_HASH_SALT`)
- Notes: This is the hot write table. All inserts are batch operations via BullMQ worker. No single-row inserts. Partition pruning ensures only relevant partitions are scanned.

## EvaluationStatsHourly

- Fields: `id` (bigserial PK), `organizationId` (uuid FK → organizations), `projectId` (uuid FK → projects), `environmentId` (uuid FK → environments), `featureFlagId` (uuid FK → feature_flags), `variationId` (uuid FK → variations, nullable for aggregated errors), `evaluationReason` (text), `uniqueUsers` (bigint, approximate distinct count), `totalCount` (bigint), `bucket` (timestamptz, truncated to hour)
- Relationships: Belongs to Organization, Project, Environment, FeatureFlag. Optionally belongs to Variation.
- Rules:
  - UNIQUE constraint on `(organization_id, feature_flag_id, environment_id, variation_id, evaluation_reason, bucket)`
  - Upsert (INSERT ... ON CONFLICT UPDATE) used to increment counts during aggregation
  - `uniqueUsers` uses HLL (HyperLogLog) approximation via `approx_count_distinct()` if available, otherwise exact `COUNT(DISTINCT context_user_hash)` from raw events
- Notes: This is the primary read table for dashboard queries. All time ranges > 24 hours query this table instead of raw events. Updated every hour by the aggregator cron job.

## EvaluationStatsDaily

- Fields: `id` (bigserial PK), `organizationId` (uuid FK → organizations), `featureFlagId` (uuid FK → feature_flags, nullable), `environmentId` (uuid FK → environments, nullable), `variationId` (uuid FK → variations, nullable), `evaluationReason` (text, nullable — NULL means aggregated over all reasons), `uniqueUsers` (bigint), `totalCount` (bigint), `bucket` (timestamptz, truncated to day)
- Relationships: Belongs to Organization. Optionally belongs to FeatureFlag, Environment, Variation.
- Rules:
  - UNIQUE constraint on `(organization_id, feature_flag_id, environment_id, evaluation_reason, bucket)` where `variation_id IS NULL`
  - Rolled up from `evaluation_stats_hourly` daily
  - Only flag × environment × reason granularity (variation-level detail not retained past 90 days)
- Notes: Long-term trend storage (2 years). Used for year-over-year comparisons.

## Redis Pub/Sub Channels (transient)

- `analytics:{organizationId}` — evaluation events for real-time SSE streaming
- `analytics:heartbeat` — worker health signals  
- Notes: These are ephemeral, no persistence needed. SSE subscribers subscribe to their organization's channel.

## Hash Salt

- Field: `EVALUATION_USER_HASH_SALT` environment variable
- Rules:
  - Must be a random 64-character hex string, generated once per deployment
  - Same salt used for both `contextUserHash` and `clientIpHash`
  - MUST NOT be committed to version control
  - Rotation requires rehashing all historical data (out of scope for v1)
- Notes: Per-deployment salt ensures that even if two Flagix deployments have the same user IDs, their hashes differ.
