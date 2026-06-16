# Tasks: Feature Flag SDKs (Core & React)

**Input**: Design documents from `/specs/002-feature-flag-sdks/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Scope**: Implementation of `packages/sdk-core` and `packages/sdk-react`.

**Tests**: Unit tests and integration tests are required to ensure fail-safe behavior and deterministic results.

## Phase 1: Setup & Scaffolding (Universal Infrastructure)

**Purpose**: Initialize packages and shared build/test configurations.

- [ ] T001 Create `packages/sdk-core/package.json` with ESM/CJS exports and dependencies (`eventsource`).
- [ ] T002 Create `packages/sdk-react/package.json` with ESM/CJS exports and dependencies (`react`, `use-sync-external-store`).
- [ ] T003 [P] Configure `tsup` for universal bundling in both packages.
- [ ] T004 [P] Setup `vitest` with `happy-dom` in `packages/sdk-core` and `packages/sdk-react`.
- [ ] T005 [P] Create `packages/sdk-core/src/types.ts` re-exporting types from `@flagix/shared`.

**Checkpoint**: Infrastructure ready — build and test pipelines operational.

---

## Phase 2: Foundational (sdk-core)

**Purpose**: Core logic for fetching, caching, and storage abstraction.

- [ ] T006 [P] Implement `FlagixStorage` interface and adapters in `packages/sdk-core/src/storage/`: `InMemoryStorage` (default) and `LocalStorageStorage` (Browser).
- [ ] T007 Implement `SdkCache` manager in `packages/sdk-core/src/cache.ts` with TTL logic and storage serialization.
- [ ] T008 [P] Implement `EvaluationClient` in `packages/sdk-core/src/api-client.ts` using native `fetch` for batch evaluation (`/api/v1/evaluate/all`) and single evaluation (`/api/v1/evaluate`).
- [ ] T009 Implement `FlagixClient` class in `packages/sdk-core/src/client.ts` orchestrating initialization, context management, and flag retrieval.

**Checkpoint**: Core SDK can fetch and cache flags from the backend.

---

## Phase 3: Real-Time Sync (SSE)

**Purpose**: Integration with SSE for reactive flag updates.

- [ ] T010 Implement `SseClient` in `packages/sdk-core/src/sse.ts` using universal `EventSource` (with `eventsource` polyfill for Node.js).
- [ ] T011 [P] Implement exponential backoff with jitter utility in `packages/sdk-core/src/utils/backoff.ts`.
- [ ] T012 Integrate `SseClient` into `FlagixClient` to trigger `FR-005b` (re-fetch single flag on mutation).
- [ ] T013 Add event emitter to `FlagixClient` to notify subscribers of cache updates.

**Checkpoint**: SDK stays in sync with backend changes in real-time.

---

## Phase 4: User Story 5 - React SDK (Priority: P1) 🎯 MVP

**Goal**: Provide idiomatic React hooks and provider for the Core SDK.

**Independent Test**: Mount `FlagixProvider` and verify `useFlag` returns correct initial value and updates on SSE event.

### Tests for User Story 5

- [ ] T014 [P] [US5] Unit tests for `FlagixProvider` in `packages/sdk-react/src/provider.test.tsx`.
- [ ] T015 [P] [US5] Hook tests for `useFlag` using `@testing-library/react` and `msw` in `packages/sdk-react/src/hooks.test.tsx`.

### Implementation for User Story 5

- [ ] T016 [US5] Implement `FlagixProvider` in `packages/sdk-react/src/provider.tsx`.
- [ ] T017 [US5] Implement `useFlag` and `useFlags` hooks using `useSyncExternalStore` in `packages/sdk-react/src/hooks.ts`.
- [ ] T018 [US5] Implement `useFlagix` hook to expose the raw client instance.

**Checkpoint**: React applications can consume feature flags reactively.

---

## Phase 5: Resiliency & Fail-Safe (Priority: P1)

**Purpose**: Ensure the SDK never crashes the host app and returns safe defaults.

- [ ] T019 Implement global error boundary/wrapper for all SDK methods to return safe defaults (FR-006).
- [ ] T020 [P] Integration test for backend outage (Scenario 6) in `packages/sdk-core/test/resiliency.test.ts`.
- [ ] T021 [P] Integration test for persistent cache survival (Scenario 3) in `packages/sdk-core/test/persistence.test.ts`.

---

## Phase 6: Final Validation

**Purpose**: End-to-end verification against real backend.

- [ ] T022 Execute all scenarios in `specs/002-feature-flag-sdks/quickstart.md`.
- [ ] T023 [P] Verify bundle sizes and universal compatibility (Node vs Browser).
