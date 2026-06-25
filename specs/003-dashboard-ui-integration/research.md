# Phase 0: Research & Clarifications

## Frontend Testing Framework
- **Decision**: Vitest with React Testing Library.
- **Rationale**: Vite is the build tool, so Vitest integrates natively without configuration overhead. React Testing Library is the industry standard for testing React components from a user perspective.
- **Alternatives considered**: Jest (slower, requires extra config with Vite), Cypress Component Testing (heavier, better for E2E).

## HTTP Client
- **Decision**: `ky` integrated with TanStack Query.
- **Rationale**: `ky` is an elegant and lightweight HTTP client based on the browser `fetch` API. It natively supports automatic JSON parsing, request retries, and timeout handling with minimal boilerplate, fulfilling the exact feature requirements while integrating seamlessly with TanStack Query.
- **Alternatives considered**: Native `fetch` API (requires writing manual wrapper code for timeouts and JSON handling), Axios (heavier bundle size compared to ky).
