# Flagix Core SDK

Universal TypeScript SDK for the Flagix feature flag platform. Works in browser and Node.js 18+ environments.

## Installation

```bash
pnpm add @flagix/sdk-core
```

## Quick Start

### Browser (stateful mode)

```typescript
import { FlagixClient } from '@flagix/sdk-core';

const client = new FlagixClient({
  sdkKey: 'sdk_client_xxxxx',
  baseUrl: 'http://localhost:9000/api/v1',
  persistent: true,    // Cache flags in localStorage
  ttl: 30000,          // Cache expires after 30 seconds
});

await client.init({ userId: 'user-123', role: 'admin' });

// Read flags — always returns a value, never throws
const darkMode = client.getFlagValue('dark-mode', false);

// Subscribe to real-time updates (SSE)
client.subscribe((flags) => {
  console.log('Flags updated:', flags);
});

// React to SDK readiness
client.onReady((ready) => {
  console.log(ready ? 'SDK ready' : 'SDK reconnecting');
});

// Switch user context (clears cache, re-fetches)
await client.setContext({ userId: 'user-456' });

// Clean up
client.close();
```

### Server (stateless mode)

On the server, each request has a different user context. Do not call `init()`. Use `evaluate()` or `evaluateAll()` per-request instead.

```typescript
import { FlagixClient, type EvaluationContext } from '@flagix/sdk-core';

const flagix = new FlagixClient({
  sdkKey: process.env.FLAGIX_SDK_KEY,
  persistent: false,  // No cache — each request is independent
});

app.get('/api/flags', async (req, res) => {
  const ctx: EvaluationContext = {
    userId: req.query.userId as string,
    role: req.query.role as string,
    attributes: { plan: req.query.plan, country: req.query.country },
  };
  const flags = await flagix.evaluateAll(ctx);
  res.json({ context: ctx, flags });
});

app.get('/api/feature/:key', async (req, res) => {
  const ctx: EvaluationContext = { userId: req.query.userId as string };
  // Falls back to `defaultValue` if the backend is unreachable
  const value = await flagix.evaluate(req.params.key, ctx, 'fallback');
  res.json({ enabled: value });
});
```

## Configuration

| Option | Type | Default | Description |
|---|---|---|---|
| `sdkKey` | `string` | (required) | SDK key from the Flagix dashboard |
| `baseUrl` | `string` | `http://localhost:9000/api/v1` | Flagix API base URL |
| `ttl` | `number` | `300000` (5 min) | Cache time-to-live in milliseconds |
| `persistent` | `boolean` | `false` | Store cache in localStorage (browser only) |
| `reconnectJitter` | `number` | `0.5` | SSE reconnect jitter factor (0–1) |
| `initialFlags` | `Record<string, EvaluationResult>` | — | Bootstrap flags to skip the initial fetch |

## API Reference

### Stateful API (requires `init()`)

| Method | Returns | Description |
|---|---|---|
| `init(context)` | `Promise<void>` | Initialize SDK with user context. Loads cache, starts SSE, fetches flags. |
| `setContext(context)` | `Promise<void>` | Switch to a new user context. Clears cache and re-fetches all flags. |
| `getFlagValue(key, default)` | `T` | Get a flag's resolved value. Returns `default` on error or if absent. |
| `getFlag(key)` | `EvaluationResult \| null` | Get the full evaluation result for a flag. |
| `getAllFlags()` | `Record<string, EvaluationResult>` | Get a snapshot of all currently evaluated flags. |
| `subscribe(cb)` | `() => void` | Subscribe to cache updates. Returns unsubscribe function. |
| `onReady(cb)` | `() => void` | Subscribe to SDK readiness state changes. |
| `offReady(cb)` | `void` | Unsubscribe from readiness callbacks. |
| `getIsReady()` | `boolean` | Whether the SDK has completed initialization. |
| `close()` | `void` | Stop SSE connection and clear subscribers. |

### Stateless API (no `init()` required)

| Method | Returns | Description |
|---|---|---|
| `evaluate(key, context, default)` | `Promise<T>` | Evaluate a single flag for the given context directly from the backend. Returns `default` on failure. |
| `evaluateAll(context)` | `Promise<Record<string, EvaluationResult>>` | Evaluate all active flags for the given context directly from the backend. |

## EvaluationResult

```typescript
interface EvaluationResult {
  flagKey: string;
  enabled: boolean;
  variationKey: string | null;
  resolvedValue: boolean | string | Record<string, unknown> | null;
  evaluationReason:
    | 'KILL_SWITCH' | 'USER_TARGETING' | 'ROLE_TARGETING'
    | 'PERCENTAGE_ROLLOUT' | 'CUSTOM_RULE' | 'SEGMENT_TARGETING'
    | 'DEFAULT' | 'FLAG_NOT_FOUND' | 'FLAG_ARCHIVED'
    | 'FLAG_DRAFT' | 'FLAG_DISABLED' | 'EVALUATION_ERROR';
}
```

## EvaluationContext

```typescript
interface EvaluationContext {
  userId?: string;
  role?: string;
  attributes?: Record<string, unknown>;
}
```

## Resiliency

- **Fail-safe**: `getFlagValue()` and `evaluate()` always return a value. If the backend is unreachable, the SDK returns the provided default. No try/catch needed around flag reads.
- **Real-time updates**: Active SSE connection to `/api/v1/flags/stream` with exponential backoff and jitter on reconnect. When a flag is modified in the dashboard, the SDK receives the event and re-fetches automatically.
- **Offline resilience**: With `persistent: true`, cached flags survive page reloads and browser restarts. The SDK serves cached values while reconnecting in the background.
- **Graceful degradation**: If both the backend and cache are unavailable, `getFlagValue()` returns the hardcoded default. Your application never breaks due to a missing flag.
