# Quickstart: Validating Feature Flag SDKs

This guide provides scenarios to validate that the SDKs work correctly with the backend.

## Prerequisites

- Backend service running at `http://localhost:3000`.
- Valid SDK Key for a "Development" environment.
- At least one active feature flag (e.g., `new-layout`) in that environment.

## Scenario 1: Initial Eager Fetch (Core SDK)

**Goal**: Verify the SDK fetches all flags on initialization.

1. Initialize `FlagixClient` with context `{ userId: 'user-1' }`.
2. Call `await client.init()`.
3. Assert that `client.getFlagValue('new-layout', false)` returns the value configured in the backend.

## Scenario 2: Real-time Update via SSE (Core SDK)

**Goal**: Verify the SDK updates when the backend mutation occurs.

1. Keep the SDK initialized from Scenario 1.
2. Manually toggle the flag `new-layout` on the backend (via Dashboard or API).
3. Wait ~500ms for SSE event and re-fetch.
4. Assert that `client.getFlagValue('new-layout', !previousValue)` returns the updated value.

## Scenario 3: Cache Persistence (Browser only)

**Goal**: Verify cache survives page reload.

1. Initialize SDK in a browser environment with `persistent: true`.
2. Wait for initial fetch to complete.
3. Refresh the page (simulate by re-instantiating the SDK).
4. Assert that the SDK returns the flag value *immediately* upon instantiation (from LocalStorage) before the network request completes.

## Scenario 4: Context Change (Core SDK)

**Goal**: Verify cache is cleared on context change.

1. Initialize SDK for `userId: 'user-1'`.
2. Call `await client.setContext({ userId: 'user-2' })`.
3. Assert that a fresh request is sent to the backend and the cache is updated with values specific to `user-2`.

## Scenario 5: React Provider & useFlag Hook

**Goal**: Verify React components re-render on flag change.

1. Wrap a component with `FlagixProvider`.
2. In the component, use `const { value } = useFlag('new-layout', false)`.
3. Manually toggle the flag on the backend.
4. Assert that the component UI updates automatically without a page refresh.

## Scenario 6: Fail-safe Behavior

**Goal**: Verify SDK returns default value when backend is unreachable.

1. Stop the backend service.
2. Initialize the SDK.
3. Assert that `client.getFlagValue('any-flag', 'fallback')` returns `'fallback'` and the SDK does not throw.
