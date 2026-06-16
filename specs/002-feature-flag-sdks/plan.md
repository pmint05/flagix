# Implementation Plan: Feature Flag SDKs (Core & React)

**Branch**: `002-feature-flag-sdks` | **Date**: 2026-06-16 | **Spec**: [spec.md](./spec.md)

## Summary

Build the `sdk-core` and `sdk-react` packages for the Flagix platform. These SDKs act as thin clients that fetch, cache, and serve feature flag values evaluated by the backend. Key features include universal environment support (Browser/Node.js), local caching with persistence (LocalStorage), real-time updates via SSE with exponential backoff, and idiomatic React integration using hooks.

## Technical Context

**Language/Version**: TypeScript 5.x

**Primary Dependencies**:
- Core: `EventSource` (Browser native), `eventsource` (Node.js polyfill)
- Core: Native `fetch` (Universal)
- React: `react` (18+), `use-sync-external-store`
- Build: `tsup` or `esbuild` for universal bundling
- Testing: `vitest`, `happy-dom`, `msw`

**Constitution Check**

- ✅ Principle I: Monorepo & Workspace Integrity (pnpm, workspace:* protocols).
- ✅ Principle IV: Separation of Concerns (SDKs contain NO evaluation logic).
- ✅ Principle VI: Fail-Safe Principle (Return safe defaults, never crash host app).
- ✅ Principle VII: Data Validation (Use shared schemas from `@flagix/shared`).

## Project Structure

### Documentation

```text
specs/002-feature-flag-sdks/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Technical decisions
├── data-model.md        # Internal data structures
├── quickstart.md        # Validation scenarios
└── contracts/
    └── sdk-api.md       # Public API surface
```

### Source Code

```text
packages/
├── sdk-core/
│   ├── src/
│   │   ├── index.ts        # Public exports
│   │   ├── client.ts       # FlagixClient implementation
│   │   ├── cache.ts        # Cache & TTL logic
│   │   ├── sse.ts          # SSE & Reconnection logic
│   │   ├── storage/        # Storage adapters (Browser/Node)
│   │   └── utils/          # Hashing, networking
│   └── test/
└── sdk-react/
    ├── src/
    │   ├── index.ts        # Public hooks & provider
    │   ├── provider.tsx    # FlagixProvider
    │   └── hooks.ts        # useFlag, useFlags, useFlagix
    └── test/
```

## Phases & Strategy

### Phase 1: Core SDK Scaffolding & Types
- Set up `package.json` for `sdk-core` with dual-mode exports (ESM/CJS).
- Import shared types from `@flagix/shared`.
- Define internal interfaces and state machine.

### Phase 2: Evaluation & Caching
- Implement `FlagixClient` fetch logic using the batch evaluation endpoint.
- Implement `CacheStore` with TTL and storage adapter support.
- Implement Browser (LocalStorage) and Node.js (In-memory) adapters.

### Phase 3: Real-time Sync (SSE)
- Implement SSE connection logic using `EventSource` / `eventsource`.
- Implement exponential backoff with jitter for reconnections.
- Integrate SSE events to trigger targeted flag re-fetches.

### Phase 4: React Wrapper
- Implement `FlagixProvider` and context.
- Implement hooks using `useSyncExternalStore` for optimized re-renders.
- Ensure reactive updates flow from `sdk-core` events to React components.

### Phase 5: Verification & Testing
- Unit tests for caching and TTL.
- Integration tests with mocked SSE and Evaluation API.
- E2E validation against a running backend using `quickstart.md`.
