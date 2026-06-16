# Feature Specification: Feature Flag SDKs (Core & React)

**Feature Branch**: `002-feature-flag-sdks`
**Created**: 2026-06-16
**Status**: Draft

## Clarifications
### Session 2026-06-16
- Q: Should the SDK cache be persistent in the browser? → A: Yes, using LocalStorage.
- Q: What is the SSE reconnection strategy? → A: Exponential Backoff with Jitter.
- Q: What is the fetching strategy for the initial load? → A: Eager (All on Init).
- Q: What is the SSE payload strategy and SDK reaction? → A: Metadata Only; SDK re-fetches only the specific flag key received from the event.
- Q: How should the Evaluation API be utilized for fetching? → A: Batch Only for initial/context-change load (`/api/v1/evaluate/all`), Individual for real-time updates (`/api/v1/evaluate`).
- Q: Is Universal Support (FR-007) identical for both environments? → A: No, persistent storage (LocalStorage) is Browser-only; Node.js uses in-memory storage only.
- Q: How should the SDK handle context updates after initialization? → A: Immediately clear cache and trigger a batch fetch of all flags.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - SDK Initialization and Authentication
As an application developer, I need to initialize the SDK with a secure key so that my application can securely connect to the feature flag platform.
**Acceptance Scenarios**:
1. **Given** a valid environment SDK Key, **When** the SDK is initialized, **Then** it authenticates successfully with the backend service.
2. **Given** an invalid SDK Key, **When** the SDK attempts to connect, **Then** it gracefully falls back to default values without crashing the host application.

### User Story 2 - Context-Aware Evaluation
As a developer, I need to provide user context (ID, role, attributes) to the SDK so that the platform can evaluate targeting rules accurately.
**Acceptance Scenarios**:
1. **Given** an initialized SDK, **When** requesting a flag value with a user ID and role, **Then** the correct variation based on backend rules is returned.
2. **Given** an anonymous user (no ID), **When** requesting a flag value, **Then** the backend's default or role-based fallback is returned.

### User Story 3 - Real-Time Reactive Updates
As a frontend developer, I want my application to update immediately when a feature flag is toggled so that users don't need to refresh the page to see new features.
**Acceptance Scenarios**:
1. **Given** an active SDK connection, **When** a flag is updated on the backend, **Then** the SDK receives the update immediately.
2. **Given** a React component using a flag hook, **When** the flag value changes via the real-time stream, **Then** the component automatically re-renders with the new value.

### User Story 4 - Resiliency and Fallback (Fail-Safe)
As a developer, I need the SDK to continue functioning even if the feature flag backend is down so that my application remains highly available.
**Acceptance Scenarios**:
1. **Given** the backend service is unreachable, **When** a flag is evaluated, **Then** the SDK returns the last known cached value.
2. **Given** no cached value exists and the backend is unreachable, **When** a flag is evaluated, **Then** the SDK returns a developer-provided safe default.

### User Story 5 - React Framework Integration
As a React developer, I need idiomatic hooks and providers so that I can easily integrate feature flags without writing boilerplate code.
**Acceptance Scenarios**:
1. **Given** the SDK React Provider wraps the application tree, **When** a child component calls the flag hook, **Then** it receives the correct flag state.
2. **Given** multiple components evaluating flags, **When** the context changes, **Then** components re-render efficiently without unnecessary update cycles.

## Requirements *(mandatory)*

### Functional Requirements

#### Core SDK (Universal)
- **FR-001**: The SDK MUST operate as a "thin client". It MUST NOT contain any rule evaluation logic, delegating all evaluations to the backend.
- **FR-002**: The SDK MUST authenticate with the backend Evaluation API using the `X-SDK-Key` header.
- **FR-003**: The SDK MUST accept evaluation context including `userId`, `roles`, and custom attributes.
- **FR-003a**: Upon evaluation context update, the SDK MUST immediately clear the current cache and trigger a fresh batch fetch (`/api/v1/evaluate/all`).
- **FR-004**: The SDK MUST implement a local caching layer with a configurable time-based TTL.
- **FR-004a**: The Browser SDK MUST support persistent storage using LocalStorage to ensure cache survival across sessions.
- **FR-004b**: The Node.js SDK MUST use in-memory storage only for caching.
- **FR-004c**: The SDK MUST eagerly fetch all relevant feature flags for the provided context during initialization via the batch evaluation endpoint (`/api/v1/evaluate/all`) to populate the cache.
- **FR-005**: The SDK MUST integrate with the backend's Server-Sent Events (SSE) stream to detect flag mutations.
- **FR-005a**: The SSE connection MUST implement a resilient reconnection strategy using exponential backoff with jitter.
- **FR-005b**: Upon receiving a mutation event for a specific flag key from the SSE stream, the SDK MUST trigger a background re-fetch of that specific flag via the individual evaluation endpoint (`/api/v1/evaluate`) to update the cache.
- **FR-006**: The SDK MUST implement a fail-safe mechanism, returning a default value (last cached or developer-provided) on network failure or backend error.
- **FR-007**: The core SDK MUST be universally compatible with both Node.js (server) and Browser (client) environments, with environment-specific storage adapters.

#### React SDK (Wrapper)
- **FR-008**: The React SDK MUST provide a Provider component to initialize the core SDK and manage global context for the React tree.
- **FR-009**: The React SDK MUST expose a hook to evaluate a specific flag with a default fallback value.
- **FR-010**: The React SDK MUST expose a hook to retrieve all evaluated flags for the current context.
- **FR-011**: The React SDK MUST expose a hook providing direct access to the underlying core client instance.
- **FR-012**: The React SDK hooks MUST trigger automatic and optimized component re-renders exclusively when the requested flag's value changes via the real-time stream.

## Assumptions
- The backend API (`/api/v1/evaluate` and `/api/v1/flags/stream`) is fully deployed and stable.
- Network environments support Server-Sent Events (SSE).
- Host applications manage their own user identity and will pass the resolved user ID/role into the SDK context.
- Initial load performance is optimized by eagerly fetching all flags for the context in a single request.
- Real-time updates use a targeted "re-fetch single flag" strategy on mutation to minimize network overhead.
- Environment-specific storage (LocalStorage vs In-Memory) is handled internally by the core SDK.
- Context updates are treated as high-priority events that require a full state refresh.

## Success Criteria *(mandatory)*

### Measurable Outcomes
- **SC-001**: 100% of rule evaluation logic resides on the backend; the SDK footprint remains minimal.
- **SC-002**: In the event of a backend outage, flag evaluation resolves to a fallback value in under 10 milliseconds.
- **SC-003**: React components re-render within 100 milliseconds of a flag mutation being broadcasted by the backend SSE stream.
- **SC-004**: 0 unhandled exceptions propagate from the SDK to the host application under any network or payload error conditions.
- **SC-005**: Cache hit rate for consecutive identical flag evaluations within the TTL window is 100%, generating zero additional network requests.
