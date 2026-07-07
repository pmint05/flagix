# Flagix Frontend

Admin dashboard for the Flagix feature flag management platform. Built with React 19, TanStack Router, Tailwind CSS v4, and HeroUI v3.

## Quick Start

This app is part of a pnpm monorepo. Run from the project root:

```bash
pnpm install
pnpm dev:frontend
```

The dashboard runs at `http://localhost:3000`. The backend must be running at `http://localhost:9000` for data access.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 |
| Build | Vite 8 |
| Routing | TanStack Router (file-based) |
| SSR | TanStack Start |
| Data fetching | TanStack Query + ky |
| UI components | HeroUI v3 (React Aria) |
| Styling | Tailwind CSS v4 |
| State | Zustand v5 |
| Forms | React Hook Form + Zod v4 |
| Charts | Recharts v3 |
| Auth | Better Auth (React client) |
| Icons | Phosphor Icons |
| Table | TanStack Table v8 |
| Drag and drop | dnd-kit |

## Project Structure

```
src/
  components/
    header/                 Top navigation bar with environment switcher
    sidebar/                Collapsible sidebar with org/project nav
    modals/                 Global modals (SDK key, segment creation)
    ui/                     Reusable UI primitives (DataTable, EmptyState, ConfirmModal, etc.)
    permission/             PermissionGuard for RBAC-controlled actions
  features/
    flags/                  Feature flag CRUD, list, detail, and editor
    flags/editor/           Flag editor with simulation tab and targeting rules
    projects/               Project management
    environments/           Environment management
    rules/                  Targeting rule CRUD
    keys/                   SDK key generation and display
    audit/                  Audit log viewer with filters
    organizations/          Organization and member management
    invitations/            Organization invitation system
    analytics/              Flag evaluation analytics and live monitoring
  hooks/                    Shared hooks (usePermission, useDebounce, etc.)
  lib/
    api.ts                  Typed API client (ky wrapper with auth and validation)
    auth-client.ts          Better Auth React client configuration
    queryClient.ts          TanStack Query client setup
    errors.ts               Error handling utilities
    utils.ts                General utilities
  routes/
    __root.tsx              Root layout (HTML shell, providers)
    _auth.tsx               Auth layout (login/signup)
    _authenticated.tsx      Authenticated layout (sidebar + header, route guard)
    orgSelect.tsx           Organization selection page
    noOrg.tsx               No-organization state
  stores/
    auth.ts                 Auth session store
    context.ts              Organization and project context
    sidebar.ts              Sidebar collapse state
    theme.ts                Theme preferences
    ui.ts                   UI state (toasts, modals)
  types/                    TypeScript type definitions
```

## Scripts

```bash
pnpm --filter frontend dev      # Start dev server (port 3000, hot reload)
pnpm --filter frontend build    # Production build
pnpm --filter frontend test     # Run Vitest tests
pnpm --filter frontend lint     # Run ESLint
```

## Authentication

The dashboard uses Better Auth for session-based authentication. The `_authenticated.tsx` layout route runs `beforeLoad` to verify the session server-side before rendering any protected content. Unauthenticated users are redirected to `/login`.

Session state is synced to a Zustand store (`stores/auth.ts`) so components can access the current user and organization context without re-fetching.

## Permission Model

Access control uses a three-role RBAC model: Admin, Editor, and Viewer. The `PermissionGuard` component wraps UI elements and checks the current user's role against the required permission. Users without sufficient access see the element in a disabled state with a tooltip explaining the restriction.

## Feature Modules

Each feature module follows the same pattern:

```
features/flags/
  api.ts          TanStack Query hooks and mutation definitions
  components/     Feature-specific UI components
  FlagModal.tsx   Create/edit dialog
  columns.tsx     Table column definitions
```

API calls go through the centralized client in `lib/api.ts`, which wraps `ky` with automatic auth token injection, Zod response validation, retry logic (GET only, 2 retries), and 401 redirect handling.

## Route Structure

```
/                         Dashboard home (after organization selection)
/login                    Sign-in page
/signup                   Registration page
/orgSelect                Organization picker
/noOrg                    Empty state when user has no org
/projects                 Project list
/projects/:slug           Project detail (environments, flags, keys, etc.)
/projects/:slug/flags     Flag list
/projects/:slug/flags/:id Flag detail and editor
/analytics                Organization-wide analytics
/audit-logs               Audit log viewer
/members                  Organization members
/settings                 Project/org settings
```
