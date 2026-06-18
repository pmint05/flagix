# Tasks: Feature Flag SDKs (Core & React)

**Input**: Design documents from `/specs/002-feature-flag-sdks/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Scope**: Implementation of `packages/sdk-core` and `packages/sdk-react`.

**Tests**: Unit and integration tests are required for all core logic and React hooks.

## Phase 1: Setup (Universal Infrastructure)

**Purpose**: Initialize packages and shared build/test configurations.

- [X] T001 Create `packages/sdk-core/package.json` with ESM/CJS exports and dependencies (`eventsource`).
- [X] T002 Create `packages/sdk-react/package.json` with ESM/CJS exports and dependencies (`react`, `use-sync-external-store`).
- [X] T003 [P] Configure `tsup` for universal bundling in both packages.
- [X] T004 [P] Setup `vitest` with `happy-dom` and `msw` in `packages/sdk-core` and `packages/sdk-react`.
- [X] T005 [P] Create `packages/sdk-core/src/types.ts` re-exporting types from `@flagix/shared`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure for storage and caching required by all user stories.

- [X] T006 [P] Implement `FlagixStorage` interface and adapters in `packages/sdk-core/src/storage/`: `InMemoryStorage` (default) and `LocalStorageStorage` (Browser).
- [X] T007 Implement `SdkCache` manager in `packages/sdk-core/src/cache.ts` with TTL logic, storage serialization, and `contextHash` comparison.
- [X] T008 [P] Implement `EvaluationClient` in `packages/sdk-core/src/api-client.ts` using native `fetch` for batch (`/all`) and individual evaluation.

**Checkpoint**: Foundation ready — internal storage and API communication established.

---

## Phase 3: User Story 1 & 2 - Initialization & Context (Priority: P1) 🎯 MVP

**Goal**: SDK can initialize, authenticate, and evaluate flags based on user context.

**Independent Test**: Scenario 1 & 4 in `quickstart.md`.

- [X] T009 [US1] Implement `FlagixClient.init()` in `packages/sdk-core/src/client.ts` to perform eager fetch all (FR-004c).
- [X] T010 [US1] Implement `FlagixClient.getFlagValue()` and `getFlag()` to serve values from cache with safe defaults (FR-006).
- [X] T011 [US2] Implement `FlagixClient.setContext()` to clear cache and trigger fresh batch fetch (FR-003a).

**Checkpoint**: Core SDK is functional for static flag evaluation.

---

## Phase 4: User Story 3 - Real-Time Updates (Priority: P1)

**Goal**: SDK receives and reacts to flag mutations via SSE.

**Independent Test**: Scenario 2 in `quickstart.md`.

- [X] T012 [US3] Implement `SseClient` in `packages/sdk-core/src/sse.ts` with exponential backoff and jitter (FR-005a).
- [X] T013 [US3] Integrate SSE events into `FlagixClient` to trigger targeted re-fetch of mutated flag keys (FR-005b).
- [X] T014 [US3] Implement subscriber pattern in `FlagixClient` to notify listeners (like React) of cache updates.

**Checkpoint**: SDK maintains real-time consistency with the backend.

---

## Phase 5: User Story 5 - React Integration (Priority: P1)

**Goal**: Idiomatic React hooks and optimized re-renders.

**Independent Test**: Scenario 5 in `quickstart.md`.

- [X] T015 [US5] Implement `FlagixProvider` in `packages/sdk-react/src/provider.tsx`.
- [X] T016 [P] [US5] Implement `useFlag` and `useFlags` using `useSyncExternalStore` for optimized re-renders (FR-012).
- [X] T017 [US5] Implement `useFlagix` to provide direct access to the `FlagixClient` instance.

**Checkpoint**: React applications can reactively consume feature flags.

---

## Phase 6: User Story 4 - Resiliency & Fail-Safe (Priority: P1)

**Goal**: Robust error handling and persistence.

**Independent Test**: Scenario 3 & 6 in `quickstart.md`.

- [X] T018 [US4] Implement global error wrapping in `FlagixClient` to ensure zero propagation of evaluation errors (FR-056).
- [X] T019 [US4] Verify persistent storage implementation in `LocalStorageStorage` for browser environments (FR-004a).
- [X] T020 [P] [US4] Add resiliency unit tests for network timeouts and malformed responses.

---

## Phase 7: Final Validation

**Purpose**: End-to-end verification and documentation.

- [X] T021 Execute all scenarios in `specs/002-feature-flag-sdks/quickstart.md`.
- [X] T022 [P] Verify bundle size and universal compatibility (Node.js 20+ and modern Browsers).
- [X] T023 Update `packages/sdk-core/README.md` and `packages/sdk-react/README.md` with usage examples from `quickstart.md`.

## Phase 8: Core SDK Enhancements (Consistency, TTL, SSR)

**Goal**: Optimize core client, align configurations, and support hydration.

- [X] T024 Fix hardcoded port inconsistencies between `api-client.ts` (3000) and `client.ts` (9000). Use a unified default or require `baseUrl`.
- [X] T025 Update `FlagixConfig` to accept `initialFlags` for SSR hydration.
- [X] T026 Update `FlagixClient.init()` to bypass network fetch if `initialFlags` are provided or if `cacheManager.isExpired()` returns false.
- [X] T027 Add internal readiness tracking (`isReady`) to `FlagixClient` and emit an event/update when initialization completes.

## Phase 9: React SDK Enhancements (Loading State & Testing Utilities)

**Goal**: Provide accurate loading states for the UI and testing tools for consumers.

- [X] T028 Update `FlagixProvider` to properly manage and distribute the `isInitializing` state.
- [X] T029 Update `useFlag` hook to dynamically return `isLoading: true` when the core SDK is not yet ready, avoiding UI flickering.
- [X] T030 Create `src/testing.tsx` in `sdk-react` and implement `MockFlagixProvider` for consumer component testing.
- [X] T031 Export testing utilities in `sdk-react`'s `index.ts`.

## Phase 10: Advanced TypeScript Usage (Documentation)

**Goal**: Guide developers on using type-safe flag keys.

- [X] T032 Update `packages/sdk-react/README.md` with an example of creating a type-safe wrapper around `useFlag`.

## Dependency Graph

- Phase 1 → Phase 2
- Phase 2 → Phase 3 (Core Logic)
- Phase 3 → Phase 4 (SSE)
- Phase 3 → Phase 5 (React depends on Core logic)
- Phase 3 → Phase 6 (Resiliency)
- All → Phase 7

## Parallel Opportunities

- T003, T004, T005 can run in parallel within Phase 1.
- T006, T008 can run in parallel within Phase 2.
- T016 can be developed in parallel with T015 once `FlagixClient` subscriber pattern is defined.
- Phase 6 (Resiliency) can be implemented in parallel with Phase 4 or 5.
