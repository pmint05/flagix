---
description: "Task list for feature implementation: Dashboard UI & Backend Integration"
---

# Tasks: Dashboard UI & Backend Integration

**Input**: Design documents from `specs/003-dashboard-ui-integration/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-contracts.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Define directory structure for features, components, routes, and lib in `apps/frontend/`
- [X] T002 Configure Zustand providers in `apps/frontend/src/routes/__root.tsx` (TanStack Router and Query are already configured)
- [X] T003 [P] Configure TailwindCSS v4, HeroUI, and Phosphor Icons in `apps/frontend/src/styles.css`
- [X] T004 [P] Implement base API client with `ky` integrating error formatting in `apps/frontend/src/lib/api.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Create generic `EmptyState` component for empty lists/pages in `apps/frontend/src/components/ui/EmptyState.tsx` (Note: Use HeroUI's native `Skeleton` for loading states instead of creating a custom one)
- [X] T006 [P] Configure HeroUI's native `Toast.Provider` (stacked, top-right desktop, top-center mobile) in `apps/frontend/src/routes/__root.tsx` for global notifications
- [X] T007 Define shared base Zod validation schemas and types in `apps/frontend/src/types/schemas.ts`
- [X] T008 Setup TanStack Query global error handler for intercepting 401s and network errors in `apps/frontend/src/lib/queryClient.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Authentication & Session (Priority: P1) 🎯 MVP

**Goal**: As a platform user, I need to sign in and sign up through a secure authentication flow so that I can access the platform with my credentials and my session is properly managed.

**Independent Test**: Can be validated by creating an account, logging in, verifying session persistence, and logging out.

### Implementation for User Story 1

- [X] T009 [P] [US1] Initialize `better-auth` React client and export session hooks in `apps/frontend/src/lib/auth-client.ts`
- [X] T010 [P] [US1] Create Auth Layout to share UI for authentication pages in `apps/frontend/src/routes/(auth)/_layout.tsx`
- [X] T011 [US1] Create Login page using HeroUI `Form`, React Hook Form and Zod validation in `apps/frontend/src/routes/(auth)/login.tsx`
- [X] T012 [US1] Create Sign up page using HeroUI `Form`, React Hook Form and Zod validation in `apps/frontend/src/routes/(auth)/signup.tsx`
- [X] T013 [US1] Configure TanStack Router context in `__root.tsx` and implement route guard using `beforeLoad` in `apps/frontend/src/routes/_authenticated.tsx` to redirect unauthenticated users to `/login`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently.

---

## Phase 4: User Story 2 - Dashboard Shell & Navigation (Priority: P1)

**Goal**: As a platform user, I need a consistent dashboard layout with sidebar navigation so that I can efficiently move between different sections of the platform.

**Independent Test**: Can be validated by verifying sidebar displays correctly, navigation works between sections, and context persists.

### Implementation for User Story 2

- [X] T014 [P] [US2] Implement Zustand store for tracking selected Organization, Project, and Environment in `apps/frontend/src/hooks/useContextStore.ts`
- [X] T015 [US2] Create Left Sidebar component (collapsible to icon) with navigation links in `apps/frontend/src/components/Sidebar.tsx`
- [X] T016 [US2] Create Header component (Sidebar Toggle, Organization Switcher, Theme Toggle) in `apps/frontend/src/components/Header.tsx` using HeroUI's native `Breadcrumbs` and `Dropdown`
- [X] T017 [US2] Create Context Switchers (Project/Env dropdowns) in `apps/frontend/src/components/ContextSwitchers.tsx`
- [X] T018 [US2] Implement Dashboard Layout (Left Sidebar, Header, and responsive Main Content with padding) in `apps/frontend/src/routes/_authenticated.tsx`

---

## Phase 5: User Story 3 - Project & Environment Management (Priority: P1)

**Goal**: As a platform administrator, I need to create, view, edit, and delete projects and environments.

**Independent Test**: Can be validated by creating a project, adding environments, editing their properties, and verifying persistence.

### Implementation for User Story 3

- [X] T019 [P] [US3] Create Projects API methods in `apps/frontend/src/features/projects/api.ts`
- [X] T020 [P] [US3] Create Environments API methods in `apps/frontend/src/features/environments/api.ts`
- [X] T021 [US3] Create Projects list page with pagination in `apps/frontend/src/routes/_authenticated/projects/index.tsx`
- [X] T022 [US3] Implement Create/Edit Project modal using HeroUI `Form`, RHF and Zod in `apps/frontend/src/features/projects/ProjectModal.tsx`
- [X] T023 [US3] Create Environments list page with soft-delete/restore in `apps/frontend/src/routes/_authenticated/projects/$projectId/environments.tsx`
- [X] T024 [US3] Implement Create/Edit Environment modal using HeroUI `Form`, RHF and Zod in `apps/frontend/src/features/environments/EnvironmentModal.tsx`

---

## Phase 6: User Story 4 - Feature Flag Management (Priority: P1)

**Goal**: As a PM or engineer, I need to create, view, edit, and manage feature flags (Boolean/Multivariate).

**Independent Test**: Can be validated by creating flags, toggling state, editing configs, and verifying persistence.

### Implementation for User Story 4

- [X] T025 [P] [US4] Create Flags API methods in `apps/frontend/src/features/flags/api.ts`
- [X] T026 [US4] Create Flags list page with status filter and client-side search in `apps/frontend/src/routes/_authenticated/projects/$projectId/flags/index.tsx` (Note: relies on `selectedEnvironment` from global store to fetch flags)
- [X] T027 [US4] Implement Flag fast toggle component in `apps/frontend/src/features/flags/FlagToggle.tsx` using HeroUI's native `Switch`
- [X] T028 [US4] Implement Create Flag modal (defines key, name, type, and immutable variations) using HeroUI `Form`, RHF and Zod in `apps/frontend/src/features/flags/FlagModal.tsx`
- [X] T029 [US4] Create Flag Detail page showing Draft/Active/Archived badges and allowing name/description updates in `apps/frontend/src/routes/_authenticated/projects/$projectId/flags/$flagId.tsx`

---

## Phase 7: User Story 5 - Targeting Rules Configuration (Priority: P2)

**Goal**: As a platform user, I need to configure targeting rules for feature flags.

**Independent Test**: Can be validated by creating rules of different types and verifying order/priority.

### Implementation for User Story 5

- [X] T030 [P] [US5] Create Rules API methods in `apps/frontend/src/features/rules/api.ts`
- [X] T031 [US5] Create Rules section for the flag detail page in `apps/frontend/src/features/rules/TargetingRules.tsx`
- [X] T032 [US5] Implement Rule editor (KillSwitch, User, Role, Percentage) allowing variation selection using HeroUI `Form` in `apps/frontend/src/features/rules/RuleEditor.tsx`
- [X] T033 [US5] Add custom Zod validation to ensure Percentage Rollout sums to exactly 100% in `apps/frontend/src/features/rules/schema.ts`
- [X] T034 [US5] Implement drag-and-drop rule reordering (recalculating LexoRank priority string for `UpdateTargetingRuleDto`) in `apps/frontend/src/features/rules/RulesList.tsx`

---

## Phase 8: User Story 6 - SDK Key Management (Priority: P2)

**Goal**: As a platform administrator, I need to create and manage SDK keys for each environment.

**Independent Test**: Can be validated by creating an SDK key, verifying one-time display, and testing deactivation.

### Implementation for User Story 6

- [X] T035 [P] [US6] Create SDK Keys API methods in `apps/frontend/src/features/keys/api.ts`
- [X] T036 [US6] Create SDK Keys page grouped by environment in `apps/frontend/src/routes/_authenticated/projects/$projectId/sdk-keys.tsx`
- [X] T037 [US6] Implement Generate Key modal with 5-key limit enforcement using HeroUI `Form` in `apps/frontend/src/features/keys/KeyModal.tsx`
- [X] T038 [US6] Implement one-time raw key display dialog and masked format view in `apps/frontend/src/features/keys/KeyDisplay.tsx`

---

## Phase 9: User Story 7 - Audit Log Viewing (Priority: P2)

**Goal**: As an admin, I need to view a chronological log of all changes.

**Independent Test**: Can be validated by performing actions and verifying they appear in the audit log.

### Implementation for User Story 7

- [X] T039 [P] [US7] Create Audit Logs API methods in `apps/frontend/src/features/audit/api.ts`
- [X] T040 [US7] Create Audit Logs list page with pagination in `apps/frontend/src/routes/_authenticated/audit-logs.tsx`
- [X] T041 [US7] Implement filtering (by entity type, actor, date range) in `apps/frontend/src/features/audit/AuditFilter.tsx`

---

## Phase 10: User Story 8 - RBAC & Permission Control (Priority: P1)

**Goal**: As an admin, I need role-based access control enforced across the UI.

**Independent Test**: Can be validated by logging in as different role types and verifying UI elements are hidden/disabled.

### Implementation for User Story 8

- [ ] T042 [P] [US8] Implement `usePermissions` hook evaluating current user role against action requirements in `apps/frontend/src/hooks/usePermissions.ts`
- [ ] T043 [US8] Create `<Protected>` wrapper component in `apps/frontend/src/components/Protected.tsx`
- [ ] T044 [US8] Apply `<Protected>` wrapping to all Create/Edit/Delete actions in Project, Environment, Flag, Rule, and SDK Key features.
- [ ] T044.b [US8] Integrate `usePermissions` into TanStack Router `beforeLoad` route guards to secure routing access based on user roles.

---

## Phase 11: User Story 9 - Responsive Design & Empty States (Priority: P1)

**Goal**: As a user, I need the interface to work on all devices and show helpful empty states.

**Independent Test**: Can be validated by resizing the browser window and checking empty pages.

### Implementation for User Story 9

- [ ] T045 [US9] Implement mobile responsiveness for Sidebar using HeroUI v3 `<Drawer>` (Hamburger menu) instead of resizing panels.
- [ ] T046 [US9] Integrate `EmptyState` component into Projects, Environments, Flags, and Audit Logs lists with action prompts.

---

## Phase 12: User Story 10 - Error Handling & User Feedback (Priority: P1)

**Goal**: As a user, I need clear feedback when operations succeed or fail without losing form data.

**Independent Test**: Can be validated by triggering errors and verifying messages without data loss.

### Implementation for User Story 10

- [ ] T047 [US10] Leverage TanStack Router's `errorComponent` for route-specific error boundaries, ensuring the sidebar/header remain functional during route failures.
- [ ] T048 [US10] Ensure all form submit handlers use mutations that prevent duplicate submissions (`isPending` state disables buttons)
- [ ] T049 [US10] Verify TanStack Query optimistic updates handle rollback and show user-friendly toasts on network failures.

---

## Phase 13: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T050 [P] Add unit tests for critical components (Rule Evaluation, RBAC hook) in `apps/frontend/src/hooks/__tests__/`
- [ ] T051 Refactor list tables (Projects, Environments, Audit Logs) into a reusable `<DataTable>` component with integrated Pagination and EmptyState.
- [ ] T052 Verify all sensitive data (emails, keys) are properly masked in UI

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on Setup. Blocks all user stories.
- **User Stories (Phase 3-12)**: Depend on Foundational. Can be executed in parallel where appropriate, but P1 stories (Auth, Navigation, Projects, Flags) should be prioritized before P2 stories (Rules, Keys, Audit Logs).
- **Polish (Phase 13)**: Depends on completion of stories.

### Parallel Opportunities
- Foundational components (T005-T008) can be developed in parallel.
- API Methods (T019, T020, T025, T030, T035, T039) can all be written concurrently since they only depend on API contracts.
- Once navigation and context (US2) is done, Projects (US3) and Audit Logs (US7) can be developed independently.

---

## Implementation Strategy

### MVP First (User Story 1, 2, 3, 4, 8)
1. Complete Setup and Foundational tasks.
2. Implement Auth (US1) to establish access.
3. Build the Dashboard Shell (US2) to provide structure.
4. Implement Project/Env (US3) and Flags (US4) as the core value.
5. Apply RBAC (US8) to secure the MVP.
6. Validate MVP independently.

### Incremental Delivery
1. Add Targeting Rules (US5) to enable advanced flag control.
2. Add SDK Keys (US6) to allow integration.
3. Add Audit Logs (US7) for observability.
4. Finish UX Polish (US9, US10).
