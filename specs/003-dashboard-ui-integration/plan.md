# Implementation Plan: Dashboard UI & Backend Integration

**Branch**: `003-dashboard-ui-integration` | **Date**: 2026-06-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-dashboard-ui-integration/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Build a complete admin interface for the Flagix platform that allows administrators and engineers to visually manage the lifecycle of feature flags. Connect the frontend application with the backend system using `ky` as the robust HTTP client integrated with TanStack Query, using shared Zod validation schemas.

## Technical Context

**Language/Version**: TypeScript (Strict Mode)

**Primary Dependencies**: React, Vite, TanStack Router, TanStack Query, ky, shadcn/ui, HeroUI, React Hook Form, Zod

**Storage**: PostgreSQL (via Backend API)

**Testing**: Vitest, React Testing Library

**Target Platform**: Web Browser (Responsive Web - Mobile to Desktop)

**Project Type**: Web Application (Admin Dashboard)

**Performance Goals**: Dashboard loads < 2s. UI updates immediately (optimistic updates). Max 1s feedback for forms.

**Constraints**: Strict Zod validation on all forms. 100% Role-Based Access Control (RBAC). No data loss on form submission errors. Graceful network error handling.

**Scale/Scope**: Up to 100 projects/organization, 500 flags/project. Paginated list views.

## Constitution Check

*GATE: Passed*

- **Monorepo**: Uses pnpm workspace packages.
- **Tech Stack**: Strict adherence to React, Vite, TanStack Query, TanStack Router, shadcn/ui, HeroUI, Zod, and React Hook Form. Better Auth for authentication.
- **Version Accuracy & Research**: CRITICAL REQUIREMENT - The project uses bleeding-edge versions (e.g., React 19, TailwindCSS v4, HeroUI v3, TanStack Start). You MUST research and search the latest official documentation to ensure the code uses the correct, modern APIs. Do not hallucinate or use legacy patterns. For HeroUI, you can automatically read the LLM-friendly documentation at:
  - https://heroui.com/react/llms.txt (General Docs)
  - https://heroui.com/react/llms-components.txt (Components)
- **UI Components**: CRITICAL REQUIREMENT - Must use native HeroUI components (e.g., Skeleton, Toast, Modal, Dropdown, Table, Switch, etc.) whenever available. Custom components should only be implemented if HeroUI does not provide the functionality (e.g., EmptyState, Sidebar).
- **Separation of Concerns**: UI contains no evaluation logic.
- **Fail-Safe**: Forms retain data on error. Network errors display graceful, user-friendly messages.
- **Validation**: Zod schemas used for all forms.
- **Multi-Tenant Isolation**: SDK keys masked; no admin keys exposed.

## Project Structure

### Documentation (this feature)

```text
specs/003-dashboard-ui-integration/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── contracts/           # Phase 1 output
    └── api-contracts.md
```

### Source Code (repository root)

```text
apps/frontend/
├── src/
│   ├── components/      # shadcn/ui and HeroUI components
│   ├── features/        # Feature-based modules (flags, projects, environments)
│   ├── hooks/           # Custom React hooks (TanStack Query integrations)
│   ├── lib/             # API client, utilities
│   ├── routes/          # TanStack Router definitions
│   └── types/           # Shared types
└── tests/               # Vitest test files
```

**Structure Decision**: A feature-based structure within the `apps/frontend` directory, using TanStack Router's standard file-based routing conventions, separating UI components from business logic (hooks/features).

## Complexity Tracking

N/A - No violations of the constitution.
