# API Contracts

Analytics API endpoints for the Evaluation Analytics feature. All endpoints require an authenticated user session (Better Auth). Analytics data is scoped to the authenticated organization.

**Base URL**: `/api/v1/organizations/:orgId/analytics`

---

## GET /overview

Organization-level analytics overview with KPIs, top flags, and environment comparison.

### Request

```
GET /api/v1/organizations/:orgId/analytics/overview
  ?from=2026-06-01T00:00:00Z       (optional, default: 24h ago)
  &to=2026-07-01T00:00:00Z         (optional, default: now)
  &granularity=hour|day              (optional, default: auto based on range)
```

### Response (200)

```json
{
  "totalEvaluations": 1528342,
  "uniqueUsers": 89421,
  "errorRate": 0.0032,
  "activeFlags": 47,
  "evaluationTrend": [
    {
      "timestamp": "2026-07-01T00:00:00Z",
      "count": 52341
    },
    {
      "timestamp": "2026-07-01T01:00:00Z",
      "count": 48921
    }
  ],
  "topFlags": [
    {
      "flagKey": "new-checkout-flow",
      "flagName": "New Checkout Flow",
      "totalCount": 452100,
      "projectName": "Web App",
      "environmentName": "Production"
    }
  ],
  "byEnvironment": [
    {
      "environmentId": "env-uuid-1",
      "environmentName": "Production",
      "totalCount": 1200000,
      "errorCount": 3200
    },
    {
      "environmentId": "env-uuid-2",
      "environmentName": "Staging",
      "totalCount": 328342,
      "errorCount": 892
    }
  ],
  "timeRange": {
    "from": "2026-06-30T00:00:00Z",
    "to": "2026-07-01T00:00:00Z",
    "granularity": "hour"
  }
}
```

### Errors

| Status | Description |
|--------|-------------|
| 401 | Unauthorized — missing or invalid session |
| 403 | Forbidden — user does not belong to this organization |

---

## GET /flags/:flagId

Per-flag analytics with time series, variation distribution, and environment breakdown.

### Request

```
GET /api/v1/organizations/:orgId/analytics/flags/:flagId
  ?from=2026-06-01T00:00:00Z       (optional, default: 24h ago)
  &to=2026-07-01T00:00:00Z         (optional, default: now)
  &granularity=hour|day              (optional, default: auto based on range)
  &environmentId=env-uuid           (optional, filter to specific environment)
```

### Response (200)

```json
{
  "flagKey": "new-checkout-flow",
  "flagName": "New Checkout Flow",
  "flagType": "multivariate",
  "totalEvaluations": 452100,
  "uniqueUsers": 31240,
  "errorCount": 892,
  "evaluationTrend": [
    {
      "timestamp": "2026-07-01T00:00:00Z",
      "count": 12341,
      "byVariation": {
        "on": 6170,
        "off": 3702,
        "beta": 2469
      }
    }
  ],
  "variationDistribution": [
    {
      "variationId": "var-uuid-1",
      "variationKey": "on",
      "count": 226050,
      "percentage": 50.0,
      "color": "#22c55e"
    },
    {
      "variationId": "var-uuid-2",
      "variationKey": "off",
      "count": 135630,
      "percentage": 30.0,
      "color": "#ef4444"
    },
    {
      "variationId": "var-uuid-3",
      "variationKey": "beta",
      "count": 90420,
      "percentage": 20.0,
      "color": "#3b82f6"
    }
  ],
  "byEnvironment": [
    {
      "environmentId": "env-uuid-1",
      "environmentName": "Production",
      "totalCount": 380000,
      "byVariation": {
        "on": 190000,
        "off": 114000,
        "beta": 76000
      }
    }
  ],
  "byReason": [
    {
      "reason": "PERCENTAGE_ROLLOUT",
      "count": 225000
    },
    {
      "reason": "USER_TARGETING",
      "count": 120000
    },
    {
      "reason": "DEFAULT",
      "count": 107100
    }
  ],
  "timeRange": {
    "from": "2026-06-30T00:00:00Z",
    "to": "2026-07-01T00:00:00Z",
    "granularity": "hour"
  }
}
```

### Errors

| Status | Description |
|--------|-------------|
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Flag not found in this organization |

---

## GET /flags/:flagId/environments/:envId

Single flag in a single environment — most granular drill-down.

### Request

```
GET /api/v1/organizations/:orgId/analytics/flags/:flagId/environments/:envId
  ?from=2026-06-01T00:00:00Z
  &to=2026-07-01T00:00:00Z
  &granularity=hour|day
```

### Response (200)

```json
{
  "flagKey": "new-checkout-flow",
  "environmentName": "Production",
  "totalEvaluations": 380000,
  "uniqueUsers": 28000,
  "evaluationTrend": [
    {
      "timestamp": "2026-07-01T00:00:00Z",
      "count": 10200,
      "byVariation": {
        "on": 5100,
        "off": 3060,
        "beta": 2040
      }
    }
  ],
  "variationDistribution": [
    {
      "variationKey": "on",
      "count": 190000,
      "percentage": 50.0
    }
  ],
  "byReason": [
    {
      "reason": "PERCENTAGE_ROLLOUT",
      "count": 190000
    }
  ],
  "timeRange": {
    "from": "2026-06-30T00:00:00Z",
    "to": "2026-07-01T00:00:00Z",
    "granularity": "hour"
  }
}
```

---

## GET /environments/:envId

All flags in a specific environment.

### Request

```
GET /api/v1/organizations/:orgId/analytics/environments/:envId
  ?from=2026-06-01T00:00:00Z
  &to=2026-07-01T00:00:00Z
```

### Response (200)

```json
{
  "environmentName": "Production",
  "totalEvaluations": 1200000,
  "flags": [
    {
      "flagId": "flag-uuid-1",
      "flagKey": "new-checkout-flow",
      "flagName": "New Checkout Flow",
      "totalCount": 380000,
      "variationDistribution": [
        { "variationKey": "on", "count": 190000, "percentage": 50.0 }
      ]
    }
  ],
  "timeRange": {
    "from": "2026-06-30T00:00:00Z",
    "to": "2026-07-01T00:00:00Z"
  }
}
```

---

## SSE GET /stream

Server-Sent Events stream of real-time evaluation events for the authenticated organization.

### Request

```
GET /api/v1/organizations/:orgId/analytics/stream
  ?flagKey=new-checkout-flow        (optional, filter to specific flag)
  &environmentId=env-uuid           (optional, filter to specific environment)
```

### Response (200, text/event-stream)

```
event: evaluation
data: {"flagKey":"new-checkout-flow","variationKey":"on","variationValue":true,"evaluationReason":"PERCENTAGE_ROLLOUT","environmentId":"env-uuid-1","environmentName":"Production","projectId":"proj-uuid-1","contextUserHash":"abc123...","timestamp":"2026-07-01T12:00:01.000Z"}

event: evaluation
data: {"flagKey":"dark-mode","variationKey":"enabled","variationValue":true,"evaluationReason":"DEFAULT","environmentId":"env-uuid-1","environmentName":"Production","projectId":"proj-uuid-1","contextUserHash":"def456...","timestamp":"2026-07-01T12:00:01.050Z"}

event: heartbeat
data: {"timestamp":"2026-07-01T12:00:05.000Z"}

event: evaluation
data: {"flagKey":"new-checkout-flow","variationKey":"error","variationValue":false,"evaluationReason":"FLAG_DISABLED","environmentId":"env-uuid-1","environmentName":"Production","projectId":"proj-uuid-2","contextUserHash":null,"timestamp":"2026-07-01T12:00:01.100Z"}
```

### Event Types

| Event | Description |
|-------|-------------|
| `evaluation` | A single flag evaluation result |
| `heartbeat` | Sent every 5 seconds to keep connection alive |
| `error` | Stream error (e.g., "rate limit exceeded") |

### Notes

- The SSE stream is buffered at 10 Hz (100ms batches) to prevent overwhelming the client at high throughput.
- Events include `projectId` and `environmentId` but NOT the raw flag data — the client already has this from other API queries.
- The stream sends all events for the organization by default; use query params to filter.
- `contextUserHash` is null when no user context was provided in the evaluation request.
- This endpoint follows the same SSE pattern as `GET /flags/stream` in the `flag-changes` module.

---

## Granularity Auto-selection

| Time Range | Default Granularity | Query Target |
|------------|---------------------|-------------|
| < 48 hours  | `hour` | `evaluation_events` (raw) |
| 48h – 90 days | `hour` | `evaluation_stats_hourly` |
| > 90 days | `day` | `evaluation_stats_daily` |
