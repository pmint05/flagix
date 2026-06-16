# Data Model: Feature Flag SDKs (Core & React)

This document defines the internal data structures and types used by the SDKs. These types are primarily based on the shared schemas in `packages/shared`.

## Client Configuration

Represents the configuration options passed to the SDK during initialization.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sdkKey` | `string` | Yes | The environment-specific SDK Key. |
| `baseUrl` | `string` | No | Override for the backend API URL. Defaults to production. |
| `ttl` | `number` | No | Cache TTL in milliseconds. Defaults to 5 minutes. |
| `persistent` | `boolean` | No | Whether to persist cache to storage (if available). |
| `reconnectJitter` | `number` | No | Jitter factor for SSE reconnection. |

## SDK Cache

The internal storage structure for evaluated flags.

```typescript
interface SdkCache {
  flags: Record<string, EvaluationResult>;
  lastUpdated: number; // Timestamp
  contextHash: string; // Hash of the evaluation context to detect changes
}
```

## Evaluation Result (Shared)

Mirrors the `EvaluationResult` from `packages/shared`.

| Field | Type | Description |
|-------|------|-------------|
| `flagKey` | `string` | Unique key of the flag. |
| `enabled` | `boolean` | Whether the flag is "on" for this context. |
| `variationKey` | `string` | Key of the assigned variation. |
| `resolvedValue` | `any` | The actual value (boolean, string, or JSON). |
| `evaluationReason` | `string` | Why this variation was chosen (e.g., "USER_TARGETING"). |

## Storage Interface

```typescript
interface FlagixStorage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}
```

## Internal State Machine (SSE)

| State | Description |
|-------|-------------|
| `CONNECTING` | Attempting to establish SSE connection. |
| `CONNECTED` | Active stream receiving updates. |
| `DISCONNECTED` | Stream closed or failed. |
| `RECONNECTING` | Waiting for backoff timer to retry connection. |
