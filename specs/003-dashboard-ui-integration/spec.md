# Feature Specification: Dashboard UI & Backend Integration

**Feature Branch**: `003-dashboard-ui-integration`

**Created**: 2026-06-18

**Status**: Draft

**Input**: User description: "Build a complete admin interface for the Flagix platform that allows administrators and engineers to visually manage the lifecycle of feature flags. Connect the frontend application with the backend system. Use an HTTP client with automatic retry, timeout handling, and tight integration with shared validation schemas."

## Clarifications

### Session 2026-06-18

- Q: Is organization creation or user invitation part of this MVP scope? → A: Organization creation and user invitation are NOT in MVP scope (orgs pre-seeded or managed via API/CLI).
- Q: Can environments be deleted and can archived flags be restored? → A: Environments use soft-delete only (deactivated, not hard-deleted). Archived flags can be restored to Draft state.
- Q: What are the expected data volumes and should lists be paginated? → A: Moderate scale (up to 100 projects/org, 500 flags/project). All list views must support pagination.
- Q: Can users have multiple SDK keys per environment and what happens if a key is lost? → A: Up to 5 active keys per environment. Users can revoke individual keys without affecting others.
- Q: Should the flag list support search and filtering? → A: Yes, filter by status (Draft/Active/Archived) and search by flag key or name.
- Q: Are Development, Staging, and Production the only allowed environment types, or can users create custom ones? → A: Those three are defaults, but users can create additional custom environment types.
- Q: Can a flag's type (Boolean vs Multivariate) be changed after creation? → A: No, flag type is fixed at creation and cannot be changed later.
- Q: Is there a maximum number of variations allowed per Multivariate flag? → A: Yes, maximum 10 variations per flag.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Authentication & Session Management (Priority: P1)

As a platform user, I need to sign in and sign up through a secure authentication flow so that I can access the platform with my credentials and my session is properly managed.

**Why this priority**: Authentication is the gateway to all platform features. Without it, no other functionality can be accessed.

**Independent Test**: Can be validated by creating an account, logging in, verifying session persistence, and logging out.

**Acceptance Scenarios**:

1. **Given** a new user visits the platform, **When** they navigate to the login page and enter valid credentials, **Then** they are authenticated and redirected to the dashboard.
2. **Given** a user has an expired session, **When** they attempt to access any protected page, **Then** they are automatically redirected to the login page with a clear notification about the expired session.
3. **Given** a user is on the login page, **When** they click the sign-up option and complete registration with valid information, **Then** an account is created and they are logged in automatically.
4. **Given** a user is authenticated, **When** they click the logout button, **Then** their session is terminated and they are redirected to the login page.
5. **Given** a user is authenticated, **When** they view the dashboard, **Then** their user information (name, email) is visible in the interface.

---

### User Story 2 - Dashboard Shell & Navigation (Priority: P1)

As a platform user, I need a consistent dashboard layout with sidebar navigation so that I can efficiently move between different sections of the platform and understand my current context (organization, project, environment).

**Why this priority**: The dashboard shell provides the structural foundation for all other features. It establishes the navigation hierarchy and context switching.

**Independent Test**: Can be validated by verifying sidebar displays correctly, navigation works between sections, and context (organization/project/environment) persists across pages.

**Acceptance Scenarios**:

1. **Given** a user is logged in, **When** they view the dashboard, **Then** a sidebar displays the current organization, project, and environment with clear visual hierarchy.
2. **Given** a user is in the dashboard, **When** they click on different sidebar sections (Projects, Environments, Flags, SDK Keys, Audit Logs), **Then** the main content area updates to show the corresponding view.
3. **Given** multiple organizations exist for a user, **When** they use the organization switcher, **Then** the dashboard context updates to reflect the selected organization and its associated projects.
4. **Given** multiple projects exist, **When** the user switches between projects, **Then** all environment and flag data updates to reflect the selected project.
5. **Given** multiple environments exist (Development, Staging, Production), **When** the user switches environments, **Then** the flag states shown reflect the selected environment's configuration.

---

### User Story 3 - Project & Environment Management (Priority: P1)

As a platform administrator, I need to create, view, edit, and delete projects and environments so that I can organize feature flags into logical groupings and deployment stages.

**Why this priority**: Projects and environments are the organizational containers for all flag operations. They must be established before flags can be managed.

**Independent Test**: Can be validated by creating a project, adding environments, editing their properties, and verifying the changes persist.

**Acceptance Scenarios**:

1. **Given** a user is on the Projects page, **When** they click "Create Project" and fill in the project name and description, **Then** a new project is created and appears in the project list.
2. **Given** a project exists, **When** the user views the project details, **Then** they see the project name, description, associated environments, and flag count.
3. **Given** a project exists, **When** the user edits the project name or description, **Then** the changes are saved and reflected immediately.
4. **Given** a project has no flags, **When** the user attempts to delete it, **Then** the project is removed after confirmation.
5. **Given** a project exists, **When** the user creates an environment (e.g., Development, Staging, Production), **Then** the environment is added to the project's environment list.
6. **Given** an environment exists, **When** the user switches to it, **Then** all flag states and configurations shown are specific to that environment.
7. **Given** an environment exists, **When** the user deactivates it, **Then** it is removed from default views but its data is preserved and can be restored later.

---

### User Story 4 - Feature Flag Management (Priority: P1)

As a product manager or engineer, I need to create, view, edit, and manage feature flags with different types (Boolean and Multivariate) so that I can control feature rollouts across environments.

**Why this priority**: Feature flags are the core entity of the platform. Managing their lifecycle is the primary value proposition.

**Independent Test**: Can be validated by creating flags of different types, toggling their state, editing configurations, and verifying state persistence.

**Acceptance Scenarios**:

1. **Given** a user is on the Flags page, **When** they click "Create Flag" and enter a flag key, name, and select Boolean type, **Then** a new flag is created in Draft state.
2. **Given** a flag is in Draft state, **When** the user views the flag list, **Then** the flag displays with a "Draft" badge and the toggle is disabled.
3. **Given** a flag is in Draft state, **When** the user activates it, **Then** the flag transitions to Active state and the toggle becomes functional.
4. **Given** a flag is Active, **When** the user uses the quick toggle to disable it, **Then** the flag's enabled state changes immediately and the change is reflected in the list.
5. **Given** a user creates a Multivariate flag, **When** they configure variations (e.g., "control", "variant-a", "variant-b"), **Then** each variation can be assigned a name and value.
6. **Given** a flag exists, **When** the user edits the flag's name, description, or variations, **Then** the changes are saved without losing any previously entered data in the form.
7. **Given** a user attempts to create a flag with a duplicate key, **When** they submit the form, **Then** a clear error message is displayed and the form data is preserved.
8. **Given** a flag is in Archived state, **When** the user restores it, **Then** the flag returns to Draft state and can be reactivated.
9. **Given** multiple flags exist with different statuses, **When** the user applies a status filter, **Then** only flags matching that status are displayed.
10. **Given** multiple flags exist, **When** the user enters a search term, **Then** only flags with matching keys or names are displayed.

---

### User Story 5 - Targeting Rules Configuration (Priority: P2)

As a platform user, I need to configure targeting rules for feature flags so that I can control which users see which variations based on conditions like user segments, roles, or percentage rollouts.

**Why this priority**: Targeting rules are essential for controlled rollouts and A/B testing. They build upon the basic flag management.

**Independent Test**: Can be validated by creating rules of different types, verifying their order/priority, and confirming rule evaluation produces expected results.

**Acceptance Scenarios**:

1. **Given** a flag is Active, **When** the user adds a targeting rule, **Then** they can select from rule types: Kill Switch, User Targeting, Role Targeting, or Percentage Rollout.
2. **Given** multiple rules exist for a flag, **When** the user views the rules list, **Then** rules are displayed in priority order with clear visual indicators.
3. **Given** multiple rules exist, **When** the user reorders rules via drag-and-drop or manual priority adjustment, **Then** the new priority order is saved and reflected immediately.
4. **Given** a Percentage Rollout rule is configured, **When** the user sets percentage values for variations, **Then** the total percentage must equal 100% and the system validates this before saving.
5. **Given** a User Targeting rule is configured, **When** the user adds specific user identifiers to a variation, **Then** those users are matched to the specified variation.
6. **Given** a rule is being edited, **When** the user modifies conditions but hasn't saved, **Then** the original data is preserved if they cancel or if an error occurs.

---

### User Story 6 - SDK Key Management (Priority: P2)

As a platform administrator, I need to create and manage SDK keys for each environment so that applications can authenticate with the platform and evaluate flags.

**Why this priority**: SDK keys are required for applications to integrate with the platform, but they are a supporting feature rather than core flag management.

**Independent Test**: Can be validated by creating an SDK key, verifying it displays once, confirming it appears in the list as masked, and testing deactivation.

**Acceptance Scenarios**:

1. **Given** a user is on the SDK Keys page for an environment, **When** they click "Generate Key" and confirm, **Then** a new SDK key is created and the raw key value is displayed exactly once.
2. **Given** an SDK key has been generated, **When** the user views the key details after the initial display, **Then** the key is shown in masked format (e.g., `fk_live_****...****`).
3. **Given** an SDK key exists, **When** the user deactivates it, **Then** applications using that key can no longer authenticate, and the key status shows as "Inactive".
4. **Given** multiple environments exist, **When** the user views SDK keys, **Then** keys are grouped by environment with clear labels.
5. **Given** a user attempts to create an SDK key without proper permissions, **When** they try to access the create function, **Then** the action is disabled or hidden based on their role.
6. **Given** an environment has 5 active SDK keys, **When** the user attempts to generate another, **Then** a clear error message indicates the limit has been reached.
7. **Given** multiple SDK keys exist for an environment, **When** the user revokes one key, **Then** only that key is deactivated while others remain active.

---

### User Story 7 - Audit Log Viewing (Priority: P2)

As a platform administrator, I need to view a chronological log of all changes made to the platform so that I can track who made what changes and when, for compliance and troubleshooting.

**Why this priority**: Audit logs provide accountability and traceability, important for compliance but secondary to core functionality.

**Independent Test**: Can be validated by performing actions (create flag, edit rule, etc.) and verifying they appear in the audit log with correct details.

**Acceptance Scenarios**:

1. **Given** changes have been made to flags, projects, or rules, **When** the user navigates to the Audit Logs page, **Then** a chronological list of all changes is displayed.
2. **Given** the audit log is displayed, **When** the user views an entry, **Then** it shows the actor (who), timestamp (when), action type, affected entity, and a summary of changes.
3. **Given** the audit log contains many entries, **When** the user applies filters (by entity type, actor, date range), **Then** the log updates to show only matching entries.
4. **Given** no changes have been made, **When** the user views the audit log, **Then** a helpful empty state message is displayed explaining that logs will appear as actions are performed.

---

### User Story 8 - RBAC & Permission Control (Priority: P1)

As a platform administrator, I need role-based access control enforced across the UI so that users with different roles (Admin, Editor, Viewer) can only perform actions appropriate to their permissions.

**Why this priority**: RBAC is a security requirement that must be in place from the beginning to prevent unauthorized actions.

**Independent Test**: Can be validated by logging in as different role types and verifying that UI elements are appropriately hidden or disabled.

**Acceptance Scenarios**:

1. **Given** a user has the Viewer role, **When** they view any page, **Then** action buttons (Create, Edit, Delete) are hidden or disabled.
2. **Given** a user has the Editor role, **When** they view the Flags page, **Then** they can create and edit flags but cannot delete them or manage SDK keys.
3. **Given** a user has the Admin role, **When** they view any page, **Then** all management functions are available.
4. **Given** a user attempts to perform an action via direct URL manipulation that their role doesn't permit, **When** the request reaches the server, **Then** it is rejected and the user sees an appropriate error message.

---

### User Story 9 - Responsive Design & Empty States (Priority: P1)

As a platform user, I need the interface to work well on all device sizes and display helpful empty states so that I can use the platform effectively regardless of my device and understand what to do when no data exists.

**Why this priority**: Responsive design ensures accessibility and empty states prevent user confusion.

**Independent Test**: Can be validated by resizing the browser window and checking empty pages for guidance messages.

**Acceptance Scenarios**:

1. **Given** a user accesses the platform on a mobile device, **When** they navigate through the dashboard, **Then** the layout adapts appropriately with collapsible sidebar and readable content.
2. **Given** a user views a page with no data (e.g., no projects yet), **When** the page loads, **Then** an empty state message is displayed with guidance on how to create the first item.
3. **Given** a user is viewing a list that is loading, **When** the data is being fetched, **Then** a loading indicator is displayed to show progress.

---

### User Story 10 - Error Handling & User Feedback (Priority: P1)

As a platform user, I need clear feedback when operations succeed or fail so that I understand what happened and what to do next.

**Why this priority**: Proper feedback prevents user frustration and data loss.

**Independent Test**: Can be validated by triggering various error conditions and success scenarios and verifying appropriate messages appear.

**Acceptance Scenarios**:

1. **Given** a user submits a form, **When** the operation succeeds, **Then** a success notification is displayed and the form data is cleared or the user is redirected appropriately.
2. **Given** a user submits a form, **When** the operation fails, **Then** an error message is displayed in natural language explaining what went wrong and suggesting next steps, while preserving all entered form data.
3. **Given** a user double-clicks a submit button, **When** the first request is in progress, **Then** the button is disabled to prevent duplicate submissions.
4. **Given** a network error occurs, **When** the user is informed, **Then** the message suggests checking connectivity or retrying, without exposing technical details.
5. **Given** an error occurs during form editing, **When** the error is displayed, **Then** all previously entered data in the form remains intact and is not lost.

---

## Functional Requirements *(mandatory)*

### Authentication & Session

- **FR-001**: The system shall provide login functionality with email and password credentials.
- **FR-002**: The system shall provide registration functionality for new users.
- **FR-003**: The system shall automatically redirect unauthenticated users to the login page when accessing any protected resource.
- **FR-004**: The system shall display a notification when a session expires and redirect to login.
- **FR-005**: The system shall provide logout functionality that terminates the session.
- **FR-006**: The system shall display the authenticated user's information in the dashboard header.

### Dashboard Navigation

- **FR-007**: The system shall display a sidebar with the current organization, project, and environment context.
- **FR-008**: The system shall allow users to switch between organizations if they belong to multiple.
- **FR-009**: The system shall allow users to switch between projects within the current organization.
- **FR-010**: The system shall allow users to switch between environments within the current project.
- **FR-011**: The system shall persist the selected context (organization, project, environment) across page navigation.

### Project Management

- **FR-012**: The system shall allow users to create projects with a name and description.
- **FR-013**: The system shall display a paginated list of projects in the current organization.
- **FR-014**: The system shall allow users to edit project details (name, description).
- **FR-015**: The system shall allow users to delete projects that have no associated flags.
- **FR-016**: The system shall display the number of flags associated with each project.

### Environment Management

- **FR-017**: The system shall allow users to create environments within a project.
- **FR-018**: The system shall provide Development, Staging, and Production as default environment types, and allow users to create additional custom environment types.
- **FR-019**: The system shall allow users to switch between environments to view environment-specific flag states.
- **FR-020**: The system shall maintain independent flag configurations per environment.
- **FR-020a**: The system shall allow users to deactivate (soft-delete) environments, preserving all data but hiding them from default views.
- **FR-020b**: The system shall allow users to restore deactivated environments back to active status.

### Feature Flag Management

- **FR-021**: The system shall allow users to create feature flags with a unique key, name, and type (Boolean or Multivariate).
- **FR-022**: The system shall create flags in Draft state by default.
- **FR-023**: The system shall display flags with their current state (Draft, Active, Archived) using visual badges.
- **FR-023a**: The system shall display flags in a paginated list view.
- **FR-023b**: The system shall allow users to filter flags by status (Draft, Active, Archived).
- **FR-023c**: The system shall allow users to search flags by key or name.
- **FR-024**: The system shall provide a quick toggle to enable/disable Active flags.
- **FR-025**: The system shall allow users to activate Draft flags.
- **FR-026**: The system shall allow users to archive Active flags.
- **FR-026a**: The system shall allow users to restore Archived flags back to Draft state.
- **FR-027**: The system shall allow users to edit flag details (name, description, variations).
- **FR-028**: The system shall support Boolean flags with enabled/disabled states.
- **FR-029**: The system shall support Multivariate flags with multiple named variations.
- **FR-029a**: The system shall enforce a maximum of 10 variations per Multivariate flag.
- **FR-029b**: The system shall display a clear error message when attempting to exceed the variation limit.
- **FR-030**: The system shall prevent creation of flags with duplicate keys within a project and display a clear error.
- **FR-031**: The system shall preserve form data when a creation or edit operation fails.
- **FR-031a**: The system shall not allow changing a flag's type (Boolean/Multivariate) after creation.

### Targeting Rules

- **FR-032**: The system shall allow users to create targeting rules for Active flags.
- **FR-033**: The system shall support rule types: Kill Switch, User Targeting, Role Targeting, Percentage Rollout.
- **FR-034**: The system shall display rules in priority order.
- **FR-035**: The system shall allow users to reorder rules via drag-and-drop or manual adjustment.
- **FR-036**: The system shall validate that Percentage Rollout rules sum to exactly 100%.
- **FR-037**: The system shall allow users to edit existing rules without losing unsaved changes.
- **FR-038**: The system shall allow users to delete individual rules.

### SDK Key Management

- **FR-039**: The system shall allow authorized users to generate SDK keys for environments.
- **FR-040**: The system shall display the raw SDK key value exactly once upon creation.
- **FR-041**: The system shall mask SDK key values in all subsequent displays.
- **FR-042**: The system shall allow users to revoke individual SDK keys without affecting other keys.
- **FR-043**: The system shall group SDK keys by environment for clarity.
- **FR-043a**: The system shall enforce a maximum of 5 active SDK keys per environment.
- **FR-043b**: The system shall display a clear error message when attempting to exceed the key limit.

### Audit Logs

- **FR-044**: The system shall record all data modifications (create, update, delete) with actor, timestamp, and change details.
- **FR-045**: The system shall display audit logs in a paginated chronological list.
- **FR-046**: The system shall allow filtering audit logs by entity type, actor, and date range.
- **FR-047**: The system shall display an informative empty state when no audit logs exist.

### RBAC & Permissions

- **FR-048**: The system shall enforce role-based access control (Admin, Editor, Viewer) across all UI functions.
- **FR-049**: The system shall hide or disable action buttons for users without appropriate permissions.
- **FR-050**: The system shall validate permissions on the server side for all API requests.
- **FR-051**: The system shall mask sensitive information (email addresses, SDK keys) in the UI.

### Input Validation & Data Integrity

- **FR-052**: The system shall validate all user input on both client and server side.
- **FR-053**: The system shall trim whitespace from all text inputs before processing.
- **FR-054**: The system shall disable submit buttons during in-progress requests to prevent duplicate submissions.
- **FR-055**: The system shall preserve form data when errors occur during submission.
- **FR-056**: The system shall detect concurrent edit conflicts and notify the user when another modification has occurred since they began editing.
- **FR-056a**: The system shall paginate all list views to support datasets up to 500 items per entity type.

### Error Handling & UX

- **FR-057**: The system shall display loading indicators for operations taking longer than one second.
- **FR-058**: The system shall show success notifications upon successful operations.
- **FR-059**: The system shall show user-friendly error messages in natural language without exposing technical details.
- **FR-060**: The system shall retry idempotent requests (GET) automatically on transient failures.
- **FR-061**: The system shall display empty state messages with guidance when lists have no data.
- **FR-062**: The system shall provide responsive layouts that adapt to all device sizes.

---

## Success Criteria *(mandatory)*

1. Users can complete the full authentication flow (sign up, log in, log out) in under 30 seconds.
2. Users can create a new feature flag from start to finish in under 60 seconds.
3. The dashboard loads and displays all navigation elements within 2 seconds of login.
4. Flag toggle operations (enable/disable) reflect immediately in the UI without page refresh.
5. 100% of UI actions are protected by role-based access control with no bypass possible via direct URL access.
6. All form inputs validate and trim data before submission, with errors displayed within 1 second.
7. The interface is fully functional on screen sizes from 320px (mobile) to 2560px (desktop).
8. 100% of empty states display helpful guidance messages rather than blank screens.
9. All API errors result in user-friendly messages with no raw technical details exposed.
10. Form data is preserved across all error scenarios with zero data loss.
11. Duplicate form submissions are prevented with 100% reliability through button disabling.
12. All sensitive data (emails, SDK keys) is masked in the UI with zero exceptions.
13. Audit logs capture 100% of data modification actions with actor and timestamp.
14. Users receive visual feedback (loading indicator) for any operation exceeding 1 second.

---

## Key Entities *(mandatory)*

- **User**: Authenticated platform user with email, name, and role assignments per organization.
- **Organization**: Top-level tenant container grouping projects and users.
- **Project**: Logical grouping of feature flags within an organization.
- **Environment**: Deployment stage (Dev, Staging, Prod) within a project, each maintaining independent flag states. Supports soft-delete (deactivation) with restoration capability.
- **Feature Flag**: Toggle entity with a unique key, name, type (Boolean/Multivariate), and lifecycle state (Draft/Active/Archived). Archived flags can be restored to Draft.
- **Variation**: Named value option within a Multivariate flag. Maximum 10 variations per flag.
- **Targeting Rule**: Condition-based rule determining which users see which flag variations, with priority ordering.
- **SDK Key**: Authentication credential for application integration, scoped to a specific environment. Up to 5 active keys per environment, individually revocable.
- **Audit Log**: Immutable record of all data modifications with actor, timestamp, action, and entity details.

---

## Edge Cases *(mandatory)*

1. **Session Expiry**: When a user's session expires mid-operation, the system redirects to login and preserves the user's intended destination for post-login redirect.
2. **Concurrent Flag Editing**: When two users edit the same flag simultaneously, the second user receives a conflict notification and must reload the latest version before saving.
3. **Duplicate Flag Key**: When a user attempts to create a flag with an existing key, a clear error message is shown and all form data is preserved.
4. **Delete Protected Project**: When a user attempts to delete a project that has flags, the system prevents deletion and displays the dependency count.
5. **SDK Key Display**: The raw SDK key is shown only once; if the user navigates away before copying, they must generate a new key (up to 5 active keys per environment).
6. **Empty Environment**: When an environment has no flags, the system displays a guided empty state with a direct link to create the first flag.
7. **Permission Boundary**: When a Viewer attempts to access admin functions via URL manipulation, the system returns a 403 response with a user-friendly message.
8. **Network Failure**: When the network is unavailable, the system displays a connectivity error with retry guidance without exposing error codes.
9. **Percentage Rollout Validation**: When percentage values don't sum to 100%, the system prevents saving and highlights the specific fields with error indicators.
10. **Form Data Loss Prevention**: When any error occurs during form submission, all previously entered data is preserved and the form remains in its current state.
11. **Variation Limit**: When a user attempts to add more than 10 variations to a Multivariate flag, the system prevents the addition and displays a clear error message.

---

## Assumptions

1. The backend API is already implemented and provides all necessary endpoints for the described functionality.
2. User authentication is handled by an external authentication service integrated with the backend.
3. Role-based access control (Admin, Editor, Viewer) is already defined in the backend and the UI enforces it visually while the backend enforces it functionally.
4. All API responses follow a consistent error format that the frontend can interpret for user-friendly messaging.
5. The platform supports multi-tenancy with organization-level data isolation already enforced by the backend.
6. SDK keys are generated and managed by the backend; the frontend only handles display and masking.
7. Audit logs are recorded by the backend for all data mutations; the frontend provides the viewing interface.
8. The design system and component library are already available for building the dashboard UI.
9. Flag state changes (e.g., toggles) are reflected immediately in the user interface without requiring manual refresh.
10. The backend supports concurrent edit detection and notifies users when conflicts occur during simultaneous modifications.
11. Expected data volumes are moderate: up to 100 projects per organization and 500 flags per project.

---

## Dependencies

1. Backend API endpoints for all CRUD operations on projects, environments, flags, rules, SDK keys, and audit logs.
2. Authentication service integration (login, logout, session management).
3. Shared validation schemas between frontend and backend for form validation consistency.
4. Frontend Technology Stack (based on `apps/frontend` configuration):
   - **Version Accuracy & Research**: CRITICAL REQUIREMENT - The project uses bleeding-edge versions (e.g., React 19, TailwindCSS v4, HeroUI v3, TanStack Start). You MUST actively search and read the official documentation to ensure the code uses correct, modern APIs. Do not guess or apply legacy code patterns. For HeroUI, you can automatically read the LLM-friendly documentation at:
     - `https://heroui.com/react/llms.txt` (General Docs)
     - `https://heroui.com/react/llms-components.txt` (Components)
   - **Framework & Routing**: React, TanStack Start, TanStack Router.
   - **Data Fetching & State**: TanStack Query, Zustand.
   - **UI & Styling**: TailwindCSS, HeroUI, Lucide React, Phosphor Icons, Motion. (CRITICAL REQUIREMENT: Must use native HeroUI components like Skeleton, Toast, Modal, Dropdown, Table, Switch, etc. whenever available. Only implement custom components if HeroUI does not provide them, e.g., EmptyState, Sidebar.)
   - **Forms & Validation**: React Hook Form, Zod.
   - **Testing**: Vitest, React Testing Library.
5. Role-based access control definitions (Admin, Editor, Viewer permissions matrix).

---

## Out of Scope

1. Real-time collaborative editing of flags (beyond conflict detection).
2. Mobile native applications (responsive web only).
3. Advanced analytics or reporting dashboards.
4. Webhook or notification integrations.
5. API rate limiting or usage analytics in the UI.
6. Multi-factor authentication flows.
7. Custom role definitions (only predefined Admin, Editor, Viewer roles).
8. Organization creation (organizations are pre-seeded or managed via API/CLI).
9. User invitation flows (users are pre-provisioned or added via backend).
