# Feature Specification: Feature Flag Platform (Domain Model)

**Feature Branch**: `001-feature-flag-platform`

**Created**: 2026-06-07

**Status**: Refined

**Refined**: 2026-06-10 — Addressed schema design issues: (1) Detailed, entity-prefixed audit action types for better traceability; (2) Resolved circular dependency by moving `isDefault` to `Variation` and adding unique partial index; (3) Added denormalized `organizationId` to core entities for multi-tenant query performance.

**Input**: User description: "Core domain specification for Feature Flag SaaS platform defining multi-tenant structure, feature flag lifecycle, variation system, rule-based evaluation engine, A/B testing model, RBAC behavior, SDK responsibilities, and evaluation contracts."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Multi-Tenant Organization Setup (Priority: P1)

As a platform administrator, I need to establish organizations as isolated tenants so that each customer's feature flags, projects, and environments remain completely separate and secure.

**Why this priority**: Multi-tenancy is the foundational security boundary. Without proper organization isolation, the platform cannot safely serve multiple customers.

**Independent Test**: Can be validated by creating multiple organizations and verifying that data from one organization is never accessible from another.

**Acceptance Scenarios**:

1. **Given** a new organization is created, **When** administrators access the platform, **Then** all resources (projects, environments, flags) are scoped exclusively to that organization.
2. **Given** two organizations exist, **When** a user from Organization A queries resources, **Then** no resources from Organization B are visible or accessible.
3. **Given** an organization exists, **When** users create projects within it, **Then** those projects belong exclusively to that organization and cannot be moved or shared.
4. **Given** a project exists within an organization, **When** environments are created (Development, Staging, Production), **Then** each environment maintains independent flag states and configurations.

---

### User Story 2 - Feature Flag Lifecycle Management (Priority: P1)

As a product manager, I need to manage feature flags through their complete lifecycle (Draft → Active → Archived) so that I can control which flags are evaluated and maintain a clean, organized flag inventory.

**Why this priority**: Lifecycle management ensures proper governance and prevents evaluation of incomplete or deprecated flags. It's essential for safe feature rollouts.

**Independent Test**: Can be validated by creating a flag in Draft state, activating it, verifying it's evaluated, then archiving it and confirming it returns safe defaults.

**Acceptance Scenarios**:

1. **Given** a user creates a new feature flag, **When** the flag is saved, **Then** it is in Draft state and is not evaluated by the system.
2. **Given** a flag is in Draft state, **When** a user activates it, **Then** the flag transitions to Active state and becomes eligible for evaluation.
3. **Given** a flag is Active, **When** the system evaluates it for users, **Then** the flag's rules and variations are applied according to the evaluation engine.
4. **Given** a flag is Active, **When** a user archives it, **Then** the flag transitions to Archived state and always returns the safe default OFF behavior.
5. **Given** a flag is Archived, **When** any evaluation request is made, **Then** the system returns the safe default (OFF or default variation) without evaluating rules.

---

### User Story 3 - Variation Configuration for A/B Testing (Priority: P1)

As a product manager, I need to define multiple variations for a feature flag so that I can perform A/B testing and deliver different feature experiences to different user segments.

**Why this priority**: Variations enable A/B testing and dynamic configuration, which are core value propositions of the platform. Without variations, flags can only be boolean on/off.

**Independent Test**: Can be validated by creating a flag with multiple variations (e.g., "control", "variant-a", "variant-b") and verifying each variation can be returned based on targeting rules.

**Acceptance Scenarios**:

1. **Given** a user creates a feature flag, **When** they define variations with unique keys (e.g., "control", "variant-a"), **Then** each variation represents a distinct output value (boolean, string, or JSON object).
2. **Given** a flag has multiple variations, **When** the user designates one as the default variation (by setting `isDefault: true`), **Then** that variation is returned when no targeting rule matches.
3. **Given** a flag has multiple variations, **When** a user attempts to set more than one variation as default, **Then** the system MUST enforce that only one default variation exists per flag.
4. **Given** a flag has variations of type string, **When** targeting rules assign different variations to different users, **Then** each user receives the string value associated with their matched variation.
5. **Given** a flag has variations of type JSON object, **When** the system evaluates the flag, **Then** the complete JSON payload is returned as the resolved value.
6. **Given** a flag is created without explicitly defining variations, **When** it's a BOOLEAN flag, **Then** the system automatically provides "true" and "false" variations (one of which MUST be marked as default).

---

### User Story 4 - Rule-Based Targeting (Priority: P1)

As a product manager, I need to configure targeting rules based on user ID, role, and percentage rollout so that I can precisely control which users receive specific feature variations.

**Why this priority**: Targeting rules are the core mechanism for controlled rollouts and A/B testing. Without rules, all users would receive the same variation.

**Independent Test**: Can be validated by creating USER, ROLE, and PERCENTAGE rules and verifying that the correct variation is returned based on evaluation context and rule priority.

**Acceptance Scenarios**:

1. **Given** a flag has a USER targeting rule for user "user-123", **When** the system evaluates the flag for "user-123", **Then** the variation specified in the USER rule is returned (highest priority).
2. **Given** a flag has a ROLE targeting rule for role "beta-testers", **When** a user with role "beta-testers" is evaluated (and no USER rule matches), **Then** the role-targeted variation is returned.
3. **Given** a flag has a PERCENTAGE rollout rule for 30%, **When** 1000 unique users are evaluated, **Then** approximately 300 users receive the rollout variation based on deterministic hashing.
4. **Given** a flag has multiple rules of different types, **When** a user matches multiple rules, **Then** the highest priority rule wins (KILL SWITCH > USER > ROLE > PERCENTAGE > DEFAULT).
5. **Given** a flag has no matching rules for a user, **When** the system evaluates the flag, **Then** the DEFAULT variation is returned.
6. **Given** a PERCENTAGE rule exists, **When** the same user is evaluated multiple times, **Then** the same variation is returned every time (deterministic bucket assignment).
7. **Given** a KILL SWITCH is activated for a flag or environment, **When** any evaluation request is made, **Then** the system immediately returns safe OFF variation without evaluating other rules.
8. **Given** a list of targeting rules, **When** a user inserts a new rule between two existing ones, **Then** the system MUST use lexicographical ordering (fractional indexing) to determine priority without re-indexing all existing rules.

---

### User Story 5 - Deterministic Flag Evaluation (Priority: P1)

As an application developer using the SDK, I need to evaluate feature flags with user context and receive deterministic results so that my application can reliably show or hide features based on targeting rules.

**Why this priority**: Evaluation is the primary runtime operation. Deterministic evaluation ensures consistent user experiences and enables reliable A/B testing.

**Independent Test**: Can be validated by sending identical evaluation requests multiple times and verifying the same result is returned each time.

**Acceptance Scenarios**:

1. **Given** an evaluation request with flagKey and context (userId, role, attributes), **When** the system evaluates the flag, **Then** it returns: flagKey, enabled (boolean), variationKey, resolvedValue, and evaluationReason.
2. **Given** the same flagKey and context are evaluated twice, **When** both requests are processed, **Then** identical results are returned (100% deterministic).
3. **Given** an evaluation request with missing userId (anonymous user), **When** the system evaluates the flag, **Then** USER rules are skipped and ROLE/PERCENTAGE rules are evaluated normally.
4. **Given** an evaluation request with missing role, **When** the system evaluates the flag, **Then** ROLE rules are skipped and other rules are evaluated normally.
5. **Given** an evaluation request with invalid attributes, **When** the system evaluates the flag, **Then** invalid attributes are ignored silently and evaluation continues without failure.
6. **Given** a flag is in Draft state, **When** an evaluation request is made, **Then** the system returns the safe default (OFF or default variation).

---

### User Story 6 - Role-Based Access Control (Priority: P2)

As an organization administrator, I need to assign roles (ADMIN, EDITOR, VIEWER) to team members so that I can control who can create, modify, or view feature flags and configurations.

**Why this priority**: RBAC is essential for team collaboration and governance but is not required for core flag functionality. It can be added after primary features are operational.

**Independent Test**: Can be validated by assigning different roles to users and verifying that each role has the correct permissions for flag management operations.

**Acceptance Scenarios**:

1. **Given** a user has ADMIN role, **When** they attempt to create, update, or delete flags and rules, **Then** all operations are permitted.
2. **Given** a user has EDITOR role, **When** they attempt to create, update, or delete targeting rules, **Then** operations are permitted, but deletion of feature flags is restricted to ADMIN only.
3. **Given** a user has VIEWER role, **When** they attempt to view flags and rules, **Then** read access is granted, but create/update/delete operations are denied.
4. **Given** an SDK client makes an evaluation request, **When** the request is processed, **Then** RBAC is not enforced (evaluation is a server-side responsibility, not SDK-enforced).
5. **Given** a user without proper role attempts a restricted operation, **When** the request is processed, **Then** the operation is rejected with an authorization error.

---

### User Story 7 - SDK Integration and Fallback Behavior (Priority: P2)

As an application developer, I need the SDK to handle backend unavailability gracefully so that my application continues to function even when the feature flag service is down.

**Why this priority**: SDK fallback behavior ensures application resilience but is secondary to core evaluation functionality. It can be implemented after the evaluation engine is stable.

**Independent Test**: Can be validated by simulating backend unavailability and verifying that the SDK returns cached values or safe defaults without crashing the application.

**Acceptance Scenarios**:

1. **Given** the backend evaluation service is available, **When** the SDK sends an evaluation request, **Then** the evaluated variation is returned and cached locally.
2. **Given** the backend service becomes unavailable, **When** the SDK attempts evaluation, **Then** the last known good value from cache is returned.
3. **Given** no cached value exists and the backend is unavailable, **When** the SDK attempts evaluation, **Then** a safe default (OFF or default variation) is returned.
4. **Given** the SDK receives an evaluation result, **When** the application uses the result, **Then** the SDK provides a simple API that does not expose rule engine logic or business rules.
5. **Given** an invalid flag key is requested, **When** the SDK evaluates the flag, **Then** a safe default (OFF) is returned without crashing the application.
6. **Given** the SDK is integrated into an application, **When** evaluation occurs, **Then** the SDK does NOT implement rule engine logic, contain business rules, or override evaluation results.

---

### User Story 8 - User Authentication & Identity Management (Priority: P1)

As a platform user, I need to register, log in, and manage my identity so that I can securely access the feature flag management dashboard and perform operations within my organization.

**Why this priority**: Authentication is the foundation of all platform access. Without user identity, RBAC cannot be enforced, audit logs cannot attribute actions to actors, and multi-tenant isolation cannot be verified at the user level.

**Independent Test**: Can be validated by registering a new user, logging in with credentials, and verifying that authenticated requests are accepted while unauthenticated requests are rejected.

**Acceptance Scenarios**:

1. **Given** a new user provides valid registration details (email, password, name), **When** the registration request is processed, **Then** a user account is created and the user is associated with a default organization.
2. **Given** a registered user provides valid credentials, **When** the login request is processed, **Then** the system returns an authenticated session that grants access to the user's organization resources.
3. **Given** an unauthenticated request is made to a protected endpoint, **When** the request is processed, **Then** the system rejects it with an authentication error.
4. **Given** an authenticated user requests to log out, **When** the logout is processed, **Then** the session is invalidated and subsequent requests with the same credentials are rejected.
5. **Given** a user provides invalid credentials (wrong password, non-existent email), **When** the login request is processed, **Then** the system rejects the request with a generic authentication error (no information leakage about which field is incorrect).

---

### User Story 9 - User-Organization Membership (Priority: P1)

As an organization administrator, I need to manage which users belong to my organization and what roles they hold so that I can control team access to feature flag management.

**Why this priority**: User-organization membership is the bridge between authentication and multi-tenancy. Without it, authenticated users cannot be scoped to their organization's resources, and RBAC cannot be enforced per-tenant.

**Independent Test**: Can be validated by adding a user to an organization with a specific role and verifying that the user can only access resources within that organization with the permissions of their assigned role.

**Acceptance Scenarios**:

1. **Given** an organization exists, **When** an ADMIN invites a user to join the organization, **Then** the user becomes a member with the assigned role (ADMIN, EDITOR, or VIEWER).
2. **Given** a user belongs to Organization A, **When** the user attempts to access resources in Organization B, **Then** the request is rejected (cross-tenant access denied).
3. **Given** a user belongs to multiple organizations, **When** the user accesses the platform, **Then** the user can switch between organizations and only sees resources belonging to the currently selected organization.
4. **Given** an ADMIN changes a user's role within the organization, **When** the change is applied, **Then** the user's permissions are immediately updated for subsequent requests.
5. **Given** an ADMIN removes a user from the organization, **When** the removal is processed, **Then** the user loses all access to the organization's resources.
6. **Given** a user performs a state-mutating action, **When** the audit log records the action, **Then** the entry is attributed to the specific authenticated user (not a generic system actor).

---

### Edge Cases

- What happens when a feature flag key is not unique within an environment? The system MUST reject the creation and enforce uniqueness per environment.
- What happens when a targeting rule references a non-existent variation? The system MUST skip the invalid rule and continue evaluation with remaining rules or return the default variation.
- What happens when multiple rules of the same type and priority exist? The system MUST use deterministic tie-breaking (rule ID order) to select the winning rule.
- What happens when a flag transitions from Active to Archived while users are being evaluated? The system MUST complete in-flight evaluations with Active rules, then subsequent evaluations return Archived behavior.
- What happens when an organization is deleted? All associated projects, environments, flags, and rules MUST be cascade-deleted or marked as inaccessible.
- What happens when a user's role changes during an active session? The next evaluation request MUST reflect the updated role (no session-level caching of RBAC).
- What happens when a user attempts to register with an email that already exists? The system MUST reject the registration and return a generic error (no information leakage about existing accounts).
- What happens when an authenticated user's session expires? The system MUST reject subsequent requests and require re-authentication.
- What happens when a user is removed from an organization while they have an active session? The system MUST invalidate access to that organization's resources immediately; the next request MUST be rejected.
- What happens when a user belongs to no organizations? The system MUST either assign the user to a default organization or prevent access until an organization invitation is accepted.
- What happens when brute-force login attempts are detected? The system MUST implement rate limiting on authentication endpoints to prevent credential stuffing attacks.

## Clarifications

### Session 2026-06-07

- Q: Should the Global Kill Switch be included in the rule priority system? → A: Yes, add Kill Switch as highest priority rule (before USER rules).
- Q: How should the SDK handle cache invalidation when flags are updated? → A: Hybrid: Time-based TTL + real-time updates via SSE/polling for active flags.
- Q: How should percentage rollout rules behave for anonymous users? → A: Skip percentage rules for anonymous users (return default variation).
- Q: What is the audit log retention policy for Phase 1? → A: 90 days active retention + archival to cold storage.
- Q: Can EDITORs delete targeting rules, or is all deletion restricted to ADMIN only? → A: EDITORs can delete targeting rules but NOT feature flags (only ADMIN can delete flags).

## Requirements *(mandatory)*

### Functional Requirements

#### Authentication & Identity Management

- **FR-067**: System MUST require all management operations to be performed by authenticated users.
- **FR-068**: System MUST support user registration with email, password, and display name.
- **FR-069**: User email MUST be unique across the entire platform (globally unique identifier).
- **FR-070**: System MUST authenticate users via email and password credentials.
- **FR-071**: Upon successful authentication, the system MUST issue a session token that identifies the user for subsequent requests.
- **FR-072**: Session tokens MUST have a configurable expiration time.
- **FR-073**: System MUST support explicit logout that invalidates the user's session token.
- **FR-074**: Unauthenticated requests to protected endpoints MUST be rejected with an authentication error.
- **FR-075**: Failed authentication attempts MUST return a generic error message that does not reveal whether the email or password was incorrect (prevents user enumeration).
- **FR-076**: System MUST implement rate limiting on authentication endpoints to prevent brute-force and credential stuffing attacks.
- **FR-077**: User passwords MUST be stored using a secure one-way hashing algorithm (never in plain text).
- **FR-078**: System MUST support password change for authenticated users (requires current password verification).

#### User-Organization Membership

- **FR-079**: Every user MUST belong to at least one organization.
- **FR-080**: A user MAY belong to multiple organizations simultaneously.
- **FR-081**: Each user-organization membership MUST include a role assignment (ADMIN, EDITOR, or VIEWER).
- **FR-082**: Organization membership MUST be managed by users with ADMIN role within that organization.
- **FR-083**: ADMIN users MUST be able to invite new users to their organization by email.
- **FR-084**: ADMIN users MUST be able to change a member's role within the organization.
- **FR-085**: ADMIN users MUST be able to remove a member from the organization.
- **FR-086**: When a user is removed from an organization, the user MUST immediately lose access to all resources within that organization.
- **FR-087**: A user's role is scoped per-organization; the same user MAY have different roles in different organizations.
- **FR-088**: Upon registration, a new user MUST be automatically assigned to a default organization with ADMIN role.

#### Multi-Tenancy & Data Isolation

- **FR-001**: System MUST support organizations as root tenant entities with complete data isolation.
- **FR-002**: All resources (projects, environments, flags, rules) MUST belong to exactly one organization.
- **FR-003**: System MUST prevent cross-organization data access at all layers (API, evaluation, storage).
- **FR-004**: Projects MUST be logical groupings of feature flags within an organization.
- **FR-005**: Environments MUST provide isolation layers within a project (e.g., Development, Staging, Production).
- **FR-006**: Each environment MUST maintain independent flag states and configurations.
- **FR-006a**: All primary entities (Organization, Project, Environment, FeatureFlag, TargetingRule, Variation, SdkKey) MUST support soft-deletion via a `deletedAt` timestamp.

#### Feature Flag Lifecycle

- **FR-007**: Feature flags MUST support three lifecycle states: Draft, Active, Archived.
- **FR-008**: Flags in Draft state MUST NOT be evaluated by the system.
- **FR-009**: Only Active flags MUST be evaluated according to their rules and variations.
- **FR-010**: Archived flags MUST always return safe default OFF behavior without evaluating rules.
- **FR-011**: Flags MUST transition between states in the order: Draft → Active → Archived (no backward transitions).
- **FR-012**: Each feature flag MUST have a unique key within its environment scope.
- **FR-012a**: SDK Keys MUST be managed as separate entities (`SdkKey`) with a many-to-one relationship to an Environment.
- **FR-012b**: System MUST store only the SHA-256 hash of the SDK Key and a 6-8 character prefix (hint) for identification; raw keys MUST NEVER be stored.
- **FR-012c**: SDK Keys MUST be returned to the user ONLY ONCE upon creation.
- **FR-012d**: System MUST support multiple active SDK Keys per environment (e.g., for rotation or different key types like 'client' and 'server').

#### Variation Model

- **FR-013**: Feature flags MAY have multiple variations representing possible output values.
- **FR-014**: Each variation MUST have a unique key within the flag.
- **FR-015**: Variations MUST support three value types: boolean, string, and JSON object.
- **FR-016**: Every flag MUST have exactly ONE variation marked as default (`isDefault: true`).
- **FR-017**: If no targeting rule matches, the variation marked as default MUST be returned.
- **FR-018**: BOOLEAN flags MUST automatically provide "true" and "false" variations if not explicitly defined (one of which MUST be marked as default).
- **FR-019**: MULTIVARIATE flags MUST allow custom variations with string or JSON object values.

#### Rule System

- **FR-020**: System MUST support five rule types: KILL SWITCH (global override), USER targeting, ROLE targeting, PERCENTAGE rollout, and DEFAULT fallback.
- **FR-021**: Rules MUST be evaluated in strict priority order determined by a lexicographical (string-based) priority field (Fractional Indexing).
- **FR-021a**: Lexicographical priority MUST allow infinite insertions between existing rules without requiring re-indexing of other rules.
- **FR-022**: Only ONE rule can win per evaluation; if multiple rules match, the highest priority rule wins.
- **FR-023**: If multiple rules of the same type and priority exist, the system MUST use deterministic tie-breaking (rule ID order).
- **FR-023a**: KILL SWITCH rules MUST immediately return safe OFF variation when triggered, short-circuiting all subsequent rules.
- **FR-023b**: KILL SWITCH can be applied at flag-level or environment-level as a global override.
- **FR-024**: USER targeting rules MUST match specific user IDs and return the designated variation.
- **FR-025**: ROLE targeting rules MUST match users based on their role attribute.
- **FR-026**: PERCENTAGE rollout rules MUST use deterministic hashing: hash(userId + flagKey) % 100 for bucket assignment.
- **FR-027**: Percentage rollout MUST be stable; the same user MUST always remain in the same bucket across requests.
- **FR-028**: DEFAULT rules MUST serve as fallback when no other rule matches.

#### Evaluation Engine

- **FR-029**: Evaluation MUST accept input: flagKey and evaluation context (userId, role, attributes).
- **FR-030**: Evaluation MUST return output: flagKey, enabled (boolean), variationKey, resolvedValue, evaluationReason.
- **FR-031**: Evaluation MUST be 100% deterministic: identical input MUST always produce identical output.
- **FR-032**: No randomness of any kind is permitted within the evaluation engine.
- **FR-033**: Evaluation flow MUST follow this sequence: load flag → check lifecycle state → check KILL SWITCH → evaluate USER rules → evaluate ROLE rules → evaluate PERCENTAGE rules → return default if no match.
- **FR-034**: Missing userId in context MUST be treated as anonymous evaluation; USER rules and PERCENTAGE rollout rules MUST be skipped, and evaluation continues with ROLE and DEFAULT rules only.
- **FR-035**: Missing role in context MUST cause ROLE rules to be skipped; other rules evaluated normally.
- **FR-036**: Invalid attributes in context MUST be ignored silently without failing evaluation.
- **FR-037**: Evaluation MUST never crash or throw errors to client applications; safe defaults MUST be returned on failure.

#### Role-Based Access Control (RBAC)

- **FR-038**: System MUST support three roles: ADMIN (full access), EDITOR (create/update rules), VIEWER (read-only).
- **FR-039**: RBAC MUST be enforced at the API layer for all management operations.
- **FR-040**: SDK evaluation requests MUST NOT enforce RBAC (server-side responsibility only).
- **FR-041**: ADMIN role MUST grant full system access including create, update, and delete operations, as well as organization membership management.
- **FR-042**: EDITOR role MUST grant create, update, and delete permissions for targeting rules, but restrict deletion of feature flags (only ADMIN can delete flags).
- **FR-043**: VIEWER role MUST grant read-only access to all resources.
- **FR-044**: Unauthorized operations MUST be rejected with appropriate authorization errors.
- **FR-044a**: RBAC MUST be enforced per-organization; a user's role in one organization MUST NOT grant permissions in another organization.
- **FR-044b**: All RBAC checks MUST verify that the authenticated user is a member of the target organization before evaluating role permissions.

#### SDK Behavior

- **FR-045**: SDK MUST send evaluation requests to the backend and receive evaluated flag variations.
- **FR-046**: SDK MUST cache evaluation results locally with a configurable time-based TTL for performance and fallback.
- **FR-046a**: SDK MUST subscribe to real-time flag updates via SSE or polling for actively evaluated flags.
- **FR-046b**: When real-time updates indicate a flag has changed, SDK MUST invalidate cached values for that flag and fetch fresh evaluation.
- **FR-046c**: If real-time connection is lost, SDK MUST continue using cached values until TTL expires, then fetch fresh evaluation.
- **FR-047**: SDK MUST handle backend unavailability by returning cached values or safe defaults.
- **FR-048**: SDK MUST provide a simple API for developers without exposing rule engine logic.
- **FR-049**: SDK MUST NOT implement rule engine or evaluation logic (server-side only).
- **FR-050**: SDK MUST NOT contain business rules or override evaluation results.
- **FR-051**: SDK MUST return safe defaults (OFF or default variation) when backend is unreachable and no cache exists.

#### System Failure Behavior

- **FR-052**: If evaluation service is unavailable, the system MUST return safe default (OFF or default variation).
- **FR-053**: If cache is stale, the SDK MUST fallback to last known good value.
- **FR-054**: If invalid flag key is provided, the system MUST return OFF without error.
- **FR-055**: System MUST NEVER crash client applications due to evaluation failures.
- **FR-056**: All evaluation failures MUST be logged for observability but MUST NOT propagate to end users.

#### Audit Logging

- **FR-061**: System MUST maintain immutable audit logs for all state-mutating operations using detailed, entity-specific action types:
  - **General**: ORG_CREATE/UPDATE/DELETE, PROJ_CREATE/UPDATE/DELETE, ENV_CREATE/UPDATE/DELETE.
  - **Security**: SDK_KEY_CREATE, SDK_KEY_REVOKE.
  - **Member**: MBR_INVITE, MBR_ROLE_CHANGE, MBR_REMOVE.
  - **Flag**: FLAG_CREATE, FLAG_UPDATE, FLAG_TOGGLE_ON, FLAG_TOGGLE_OFF, FLAG_ACTIVATE, FLAG_ARCHIVE, FLAG_SOFT_DELETE, FLAG_RESTORE, FLAG_VAR_UPDATE, FLAG_RULE_UPDATE.
- **FR-062**: Audit log entries MUST include: timestamp, authenticated user (actor), action type, affected entity, entity ID, and before/after state.
- **FR-062a**: The actor field in audit log entries MUST reference the authenticated User who performed the action, including the user's identity (user ID and email) at the time of the action (snapshot for historical accuracy).
- **FR-062b**: System-initiated actions (e.g., automated archival) MUST be recorded with a system actor type, distinct from user-initiated actions.
- **FR-063**: Audit logs MUST be retained in active storage for 90 days from creation date.
- **FR-064**: Audit logs older than 90 days MUST be archived to cold storage for long-term retention.
- **FR-065**: Archived audit logs MUST remain queryable but may have higher latency than active logs.
- **FR-066**: Audit logs MUST NOT be modified or deleted once created (immutability guarantee).

#### Extensibility

- **FR-057**: System architecture MUST allow future extension to advanced targeting (geo, device, segment).
- **FR-058**: System MUST support future experiment engine integration for A/B/n testing.
- **FR-059**: System MUST allow future analytics integration without core architecture changes.
- **FR-060**: Extensibility points MUST be defined at domain boundaries without prescribing implementation details.

### Key Entities *(include if feature involves data)*

- **User**: Represents an authenticated individual who accesses the platform. Has a globally unique email, a display name, and a securely stored password hash. Users authenticate to obtain session tokens for accessing management APIs. A user can belong to multiple organizations with different roles in each.

- **OrganizationMember**: Represents the relationship between a User and an Organization. Each membership includes a role assignment (ADMIN, EDITOR, or VIEWER) that determines the user's permissions within that specific organization. A user can have multiple memberships (one per organization), and each membership is independently managed.

- **Organization**: Root tenant entity representing a customer or business unit. Provides complete data isolation for all resources. All projects, environments, flags, and rules belong to exactly one organization. Users access organization resources through their membership.

- **Project**: Logical grouping of feature flags within an organization. Represents a product, application, or service. Contains multiple environments for different deployment stages.

- **Environment**: Isolation layer within a project representing a deployment stage (Development, Staging, Production). Each environment maintains independent flag states and configurations. Feature flags are scoped to specific environments. Environments support multiple `SdkKeys`.

- **SdkKey**: Represents a secure key used by SDKs to authenticate evaluation requests. Each key has a name, a type (client/server), and is stored as a SHA-256 hash. The system provides a 6-8 character prefix (hint) for identification. Raw keys are never stored and are only displayed once upon creation.

- **Feature Flag**: Core entity controlling feature availability. Has a unique key per environment. Supports two modes: BOOLEAN (on/off) and MULTIVARIATE (multiple variations). Includes lifecycle state (Draft, Active, Archived). Exactly one of its variations MUST be marked as default.

- **Variation**: Represents a possible output value of a feature flag. Has a unique key within the flag. Can be boolean, string, or JSON object. Used for A/B testing and dynamic configuration. Exactly one variation per flag MUST be marked as default (`isDefault: true`).

- **Rule**: Defines targeting logic for feature flags. Determines which variation is returned for a given evaluation context. Evaluated in strict priority order determined by lexicographical ordering. Only one rule can win per evaluation. Kill Switch rules provide global override capability.

- **Evaluation Context**: Input provided during flag evaluation. Includes userId (optional for anonymous), role (optional), and extensible attributes. Used by rules to determine which variation to return.

- **Role**: Access control assignment (ADMIN, EDITOR, VIEWER) scoped to a user's membership within an organization. Determines user permissions for management operations. Enforced at API layer, not SDK layer. A user may hold different roles across different organizations.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Organizations achieve 100% data isolation; no cross-tenant data leakage occurs in any operation.
- **SC-002**: Feature flags transition through lifecycle states (Draft → Active → Archived) with zero evaluation of Draft or Archived flags.
- **SC-003**: Evaluation engine returns deterministic results; identical inputs produce identical outputs in 100% of cases.
- **SC-004**: Rule priority order (KILL SWITCH > USER > ROLE > PERCENTAGE > DEFAULT) is enforced correctly in 100% of evaluations.
- **SC-005**: Percentage rollout achieves target distribution within 2% margin (e.g., 30% rollout yields 28-32% of users).
- **SC-006**: Percentage rollout is stable; the same user receives the same variation across 1000+ consecutive evaluations.
- **SC-007**: SDK handles backend unavailability gracefully; applications continue functioning with cached values or safe defaults.
- **SC-008**: System returns safe defaults (OFF or default variation) for 100% of evaluation failures without crashing client applications.
- **SC-009**: RBAC enforcement correctly restricts operations based on role in 100% of management API requests.
- **SC-010**: Evaluation requests complete within 100 milliseconds for 95% of requests under normal load conditions.
- **SC-011**: Multi-variation flags support A/B testing scenarios with correct variation assignment based on targeting rules.
- **SC-012**: System handles invalid or missing context attributes gracefully without evaluation failures in 100% of cases.
- **SC-013**: 100% of management API requests from unauthenticated users are rejected with authentication errors.
- **SC-014**: Users can complete registration and first login within 2 minutes.
- **SC-015**: Authentication errors never reveal whether an email exists in the system or whether the password was incorrect (zero information leakage).
- **SC-016**: 100% of audit log entries for user-initiated actions correctly reference the authenticated user who performed the action.
- **SC-017**: Role changes take effect immediately; the next request after a role change reflects the updated permissions in 100% of cases.
- **SC-018**: Users removed from an organization lose access to all organization resources within 1 second of removal.

## Assumptions

- Organizations are created through a separate provisioning process (not part of this specification).
- User authentication is managed internally by the platform via email/password credentials with session-based tokens (no external identity provider in Phase 1).
- Role assignments (ADMIN, EDITOR, VIEWER) are scoped per organization and managed by ADMIN users within each organization.
- SDK keys are generated and distributed through a secure out-of-band process.
- Evaluation context attributes (userId, role, custom attributes) are provided by the calling application and trusted by the system.
- Percentage rollout uses a cryptographically stable hashing algorithm (specific algorithm is an implementation detail).
- Cached evaluation results in SDK use a hybrid strategy: time-based TTL (configurable, default 5 minutes) combined with real-time updates via SSE or polling for actively evaluated flags. When a flag change is detected via real-time updates, the cache is invalidated immediately for that flag.
- Audit logging captures all state-mutating operations with 90 days active retention and archival to cold storage for long-term compliance and debugging needs. All user-initiated actions are attributed to the authenticated user.
- Real-time flag updates are delivered via SSE or polling (mechanism is an implementation detail).
- The system operates in a single-region deployment for Phase 1 (multi-region is a future consideration).
- Extensibility for advanced targeting, experiments, and analytics is architectural readiness only; these features are not in Phase 1 scope.
- Safe default behavior (OFF or default variation) is defined per flag and configured during flag creation.
- Evaluation reason field provides human-readable explanation for debugging but is not used for business logic.
- Rule tie-breaking by rule ID order assumes rules have stable, ordered identifiers.
- Upon registration, new users are automatically assigned to a default organization with ADMIN role.
- Session tokens are opaque, server-validated tokens (not self-contained like JWT); token storage and invalidation strategy is an implementation detail.
- OAuth2/SSO integration is out of scope for Phase 1 but the authentication system MUST be designed to allow future extension to external identity providers.
