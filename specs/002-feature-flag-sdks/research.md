# Research: Feature Flag SDKs (Core & React)

This document resolves technical unknowns and establishes architectural patterns for the `sdk-core` and `sdk-react` packages.

## Decision 1: Universal Networking
- **Decision**: Use native `fetch` (standard in Browser and Node.js 18+).
- **Rationale**: Modern universal SDKs should avoid bulky dependencies like Axios. Native `fetch` is standard and stable across our target environments. For Node.js < 18 (though we target 20+), we could polyfill, but since we target Node 20+ per backend plan, native `fetch` is safe.
- **Alternatives considered**: Axios (too heavy for Browser), `node-fetch` (redundant on Node 18+).

## Decision 2: SSE Implementation (Universal)
- **Decision**: Use `EventSource` in Browser and the `eventsource` npm package for Node.js compatibility.
- **Rationale**: `EventSource` is standard in browsers but absent in Node.js. The `eventsource` package is a reliable, widely-used polyfill that follows the W3C specification, ensuring identical behavior across environments.
- **Alternatives considered**: Custom WebSocket implementation (overkill, requires backend change), Polling (less efficient than SSE).

## Decision 3: Persistence Strategy
- **Decision**: Implement a `Storage` interface.
    - **Browser**: `LocalStorageAdapter` (persistent).
    - **Node.js**: `InMemoryAdapter` (non-persistent).
- **Rationale**: Browser users benefit from persistence across reloads. In Node.js, persistence is typically handled by the host application's external state (Redis, etc.) or is unnecessary for ephemeral server-side evaluations.
- **Alternatives considered**: `IndexedDB` for Browser (too complex for simple flag values).

## Decision 4: Resiliency & Exponential Backoff
- **Decision**: Implement custom exponential backoff with jitter for SSE reconnections and a "Stale-While-Revalidate" approach for fetching.
- **Rationale**: Built-in `EventSource` reconnection is basic. Jitter is essential to prevent thundering herd on the backend. Fail-safe principle (Constitution VI) mandates returning safe defaults on failure.
- **Alternatives considered**: Standard `setInterval` retry (lacks jitter/backoff).

## Decision 5: React State Management
- **Decision**: Use a singleton-lite Core client injected via React Context. Use `useSyncExternalStore` for the hooks.
- **Rationale**: `useSyncExternalStore` is the modern React (18+) way to subscribe to external stores (like our SDK cache) while avoiding tearing and ensuring optimal re-renders.
- **Alternatives considered**: `useEffect` + `useState` (prone to re-render loops and tearing).

## Decision 6: Testing Strategy
- **Decision**: Use `Vitest` with `Happy DOM` for browser tests and standard Node environment for core tests. Mock SSE using `msw` or a simple mock `EventSource`.
- **Rationale**: Vitest is fast and compatible with our monorepo setup. MSW (Mock Service Worker) allows intercepting network requests at the fetch level, providing realistic test scenarios.
