# Management API Contracts

**Feature**: 001-feature-flag-platform
**Base URL**: `/api/v1`
**Authentication**: Better Auth session (cookie-based or bearer token). All management routes are protected by the global AuthGuard. Unauthenticated requests receive HTTP 401.
**Content-Type**: `application/json`

All management APIs require a valid Better Auth session and are scoped to an organization via the authenticated user's OrganizationMember membership.

---

## API URL Structure

The API follows a **hybrid nested resource** pattern with organization as the root:

### Level 1-3: Nested Resources (clear hierarchy)
```
/api/v1/organizations
/api/v1/organizations/:organizationId
/api/v1/organizations/:organizationId/projects
/api/v1/organizations/:organizationId/projects/:projectId
/api/v1/organizations/:organizationId/projects/:projectId/environments
/api/v1/organizations/:organizationId/projects/:projectId/environments/:envId
```

### Level 4+: Hybrid (list nested, individual flat)
```
# Feature Flags
/api/v1/organizations/:organizationId/projects/:projectId/environments/:envId/flags  (list/create)
/api/v1/organizations/:organizationId/flags/:flagId                                  (get/update/delete)

# Targeting Rules
/api/v1/organizations/:organizationId/flags/:flagId/rules                            (list/create)
/api/v1/organizations/:organizationId/flags/:flagId/rules/:ruleId                    (get/update/delete)

# SDK Keys
/api/v1/organizations/:organizationId/environments/:envId/sdk-keys                   (list/create)
/api/v1/organizations/:organizationId/environments/:envId/sdk-keys/:keyId            (delete)

# Audit Logs
/api/v1/organizations/:organizationId/audit-logs
/api/v1/organizations/:organizationId/audit-logs/:logId
```

### Design Rationale
- **organizationId** is always present in the URL for security checks
- **List/Create** operations are nested to provide clear context
- **Individual** operations (GET/PATCH/DELETE by ID) are flat for brevity
- **Guard** only needs orgId from params (no DB lookup required)

---

## Authentication & Authorization Model

### Global Authentication

All endpoints under `/api/v1/*` are protected by a global `AuthGuard` from `@thallesp/nestjs-better-auth`. Every request MUST include a valid session cookie or bearer token.

**Session Cookie** (automatic):
```
Cookie: flagix.session=<session-token>
```

**Bearer Token** (manual):
```
Authorization: Bearer <session-token>
```

### Organization Membership Check

All resource-scoped endpoints verify that the authenticated user is a member of the organization specified in the URL. This is enforced by `OrgRolesGuard` at the controller level.

**Resolution**: The `organizationId` is always present in the URL params, so no DB lookup is required.

### Role-Based Access Control

Role-restricted endpoints use `@PlatformOrgRoles()` decorator. Role hierarchy: **ADMIN > EDITOR > VIEWER**.

| Role | Permissions |
|------|-------------|
| ADMIN | Full access: create, read, update, delete all resources |
| EDITOR | Read + create + update. Can manage targeting rules. Cannot delete orgs/projects/flags |
| VIEWER | Read-only access to all resources within the organization |

### Public Endpoints

The following endpoints are exempt from session authentication:
- `/api/auth/*` — Better Auth authentication routes
- `/api/v1/evaluate` — SDK flag evaluation (uses SDK key auth)
- `/api/v1/evaluate/all` — SDK bulk flag evaluation (uses SDK key auth)

---

## Authentication API (Better Auth)

Better Auth automatically mounts authentication routes at `/api/auth/*`. These routes handle user registration, login, session management, and password operations.

### Sign Up (Email/Password)

```text
POST /api/auth/sign-up/email
```

**Request Body**:
```json
{
  "name": "string (required)",
  "email": "string (required, valid email)",
  "password": "string (required, min 8 chars)"
}
```

**Response** (200 OK):
```json
{
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "emailVerified": "boolean",
    "createdAt": "ISO 8601 timestamp"
  },
  "session": {
    "id": "string",
    "token": "string",
    "expiresAt": "ISO 8601 timestamp"
  }
}
```

**Notes**:
- On successful registration, a default organization is created and the user is assigned as ADMIN.
- Session cookie is set automatically in the response headers.
- Returns HTTP 422 if email already exists.

---

### Sign In (Email/Password)

```text
POST /api/auth/sign-in/email
```

**Request Body**:
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Response** (200 OK):
```json
{
  "user": {
    "id": "string",
    "name": "string",
    "email": "string"
  },
  "session": {
    "id": "string",
    "token": "string",
    "expiresAt": "ISO 8601 timestamp"
  }
}
```

**Errors**:
- 401: Invalid credentials (generic error, no information leakage)

---

### Sign Out

```text
POST /api/auth/sign-out
```

**Response** (200 OK):
```json
{
  "success": true
}
```

**Notes**: Session cookie is cleared. Session record is invalidated in the database.

---

### Get Session

```text
GET /api/auth/get-session
```

**Response** (200 OK):
```json
{
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "emailVerified": "boolean",
    "image": "string | null"
  },
  "session": {
    "id": "string",
    "expiresAt": "ISO 8601 timestamp"
  }
}
```

**Response** (401 Unauthorized):
- No valid session found.

---

### Change Password

```text
POST /api/auth/change-password
```

**Request Body**:
```json
{
  "currentPassword": "string (required)",
  "newPassword": "string (required, min 8 chars)"
}
```

**Response** (200 OK):
```json
{
  "success": true
}
```

**Errors**:
- 400: Invalid current password
- 401: Session required

---

### Additional Auth Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/forget-password` | POST | Initiate password reset via email |
| `/api/auth/reset-password` | POST | Complete password reset with token |
| `/api/auth/verify-email` | GET | Verify email address |
| `/api/auth/update-user` | POST | Update user profile (name, image) |
| `/api/auth/list-sessions` | GET | List all active sessions for user |
| `/api/auth/revoke-session` | POST | Revoke a specific session |
| `/api/auth/revoke-sessions` | POST | Revoke all sessions |

---

## Organizations

### Create Organization

```text
POST /api/v1/organizations
```

**Request Body**:
```json
{
  "name": "string (1-255 chars, required)",
  "slug": "string (1-100 chars, optional, auto-generated from name)"
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "name": "string",
  "slug": "string",
  "createdAt": "ISO 8601 timestamp",
  "updatedAt": "ISO 8601 timestamp"
}
```

**Errors**:
- 400: Validation error
- 409: Slug already exists

---

### List Organizations

```text
GET /api/v1/organizations
```

**Response** (200 OK):
```json
{
  "organizations": [
    {
      "id": "uuid",
      "name": "string",
      "slug": "string",
      "role": "'admin' | 'editor' | 'viewer'",
      "createdAt": "ISO 8601 timestamp",
      "updatedAt": "ISO 8601 timestamp"
    }
  ],
  "total": "integer"
}
```

---

### Get Organization

```text
GET /api/v1/organizations/:organizationId
```

**Path Parameters**:
- `organizationId`: UUID (required)

**Response** (200 OK):
```json
{
  "id": "uuid",
  "name": "string",
  "slug": "string",
  "role": "'admin' | 'editor' | 'viewer'",
  "createdAt": "ISO 8601 timestamp",
  "updatedAt": "ISO 8601 timestamp"
}
```

**Errors**:
- 403: Not a member of this organization
- 404: Organization not found

---

### Update Organization

```text
PATCH /api/v1/organizations/:organizationId
```

**Path Parameters**:
- `organizationId`: UUID (required)

**Request Body** (all fields optional):
```json
{
  "name": "string (1-255 chars)",
  "slug": "string (1-100 chars)"
}
```

**Response** (200 OK):
```json
{
  "id": "uuid",
  "name": "string",
  "slug": "string",
  "updatedAt": "ISO 8601 timestamp"
}
```

**Errors**:
- 400: Validation error
- 403: Only ADMIN role can update organizations
- 404: Organization not found
- 409: Slug already exists

---

### Delete Organization

```text
DELETE /api/v1/organizations/:organizationId
```

**Path Parameters**:
- `organizationId`: UUID (required)

**Response** (200 OK):
```json
{
  "success": true
}
```

**Errors**:
- 403: Only ADMIN role can delete organizations
- 404: Organization not found

---

## Projects

### Create Project

```text
POST /api/v1/organizations/:organizationId/projects
```

**Path Parameters**:
- `organizationId`: UUID (required)

**Request Body**:
```json
{
  "name": "string (1-255 chars, required)",
  "slug": "string (1-100 chars, optional, auto-generated from name)",
  "description": "string (optional)"
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "name": "string",
  "slug": "string",
  "description": "string | null",
  "organizationId": "uuid",
  "createdAt": "ISO 8601 timestamp",
  "updatedAt": "ISO 8601 timestamp"
}
```

**Errors**:
- 400: Validation error
- 403: Insufficient role (requires ADMIN or EDITOR)
- 409: Slug already exists within organization

---

### List Projects

```text
GET /api/v1/organizations/:organizationId/projects
```

**Path Parameters**:
- `organizationId`: UUID (required)

**Response** (200 OK):
```json
{
  "projects": [
    {
      "id": "uuid",
      "name": "string",
      "slug": "string",
      "description": "string | null",
      "createdAt": "ISO 8601 timestamp",
      "updatedAt": "ISO 8601 timestamp"
    }
  ],
  "total": "integer"
}
```

---

### Get Project

```text
GET /api/v1/organizations/:organizationId/projects/:projectId
```

**Path Parameters**:
- `organizationId`: UUID (required)
- `projectId`: UUID (required)

**Response** (200 OK):
```json
{
  "id": "uuid",
  "name": "string",
  "slug": "string",
  "description": "string | null",
  "organizationId": "uuid",
  "createdAt": "ISO 8601 timestamp",
  "updatedAt": "ISO 8601 timestamp"
}
```

**Errors**:
- 404: Project not found

---

### Update Project

```text
PATCH /api/v1/organizations/:organizationId/projects/:projectId
```

**Path Parameters**:
- `organizationId`: UUID (required)
- `projectId`: UUID (required)

**Request Body** (all fields optional):
```json
{
  "name": "string (1-255 chars)",
  "description": "string"
}
```

**Response** (200 OK):
```json
{
  "id": "uuid",
  "name": "string",
  "slug": "string",
  "description": "string | null",
  "updatedAt": "ISO 8601 timestamp"
}
```

**Errors**:
- 400: Validation error
- 403: Insufficient role (requires ADMIN or EDITOR)
- 404: Project not found

---

### Delete Project

```text
DELETE /api/v1/organizations/:organizationId/projects/:projectId
```

**Path Parameters**:
- `organizationId`: UUID (required)
- `projectId`: UUID (required)

**Response** (200 OK):
```json
{
  "success": true
}
```

**Errors**:
- 403: Only ADMIN role can delete projects
- 404: Project not found

---

## Environments

### Create Environment

```text
POST /api/v1/organizations/:organizationId/projects/:projectId/environments
```

**Path Parameters**:
- `organizationId`: UUID (required)
- `projectId`: UUID (required)

**Request Body**:
```json
{
  "name": "string (1-100 chars, required)",
  "slug": "string (1-100 chars, optional, auto-generated from name)",
  "description": "string (optional)"
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "name": "string",
  "slug": "string",
  "description": "string | null",
  "projectId": "uuid",
  "createdAt": "ISO 8601 timestamp",
  "updatedAt": "ISO 8601 timestamp"
}
```

**Errors**:
- 400: Validation error
- 404: Project not found
- 409: Slug already exists within project

---

### List Environments

```text
GET /api/v1/organizations/:organizationId/projects/:projectId/environments
```

**Path Parameters**:
- `organizationId`: UUID (required)
- `projectId`: UUID (required)

**Response** (200 OK):
```json
{
  "environments": [
    {
      "id": "uuid",
      "name": "string",
      "slug": "string",
      "description": "string | null",
      "createdAt": "ISO 8601 timestamp",
      "updatedAt": "ISO 8601 timestamp"
    }
  ],
  "total": "integer"
}
```

---

### Get Environment

```text
GET /api/v1/organizations/:organizationId/projects/:projectId/environments/:envId
```

**Path Parameters**:
- `organizationId`: UUID (required)
- `projectId`: UUID (required)
- `envId`: UUID (required)

**Response** (200 OK):
```json
{
  "id": "uuid",
  "name": "string",
  "slug": "string",
  "description": "string | null",
  "projectId": "uuid",
  "createdAt": "ISO 8601 timestamp",
  "updatedAt": "ISO 8601 timestamp"
}
```

**Errors**:
- 404: Environment not found

---

### Delete Environment

```text
DELETE /api/v1/organizations/:organizationId/projects/:projectId/environments/:envId
```

**Path Parameters**:
- `organizationId`: UUID (required)
- `projectId`: UUID (required)
- `envId`: UUID (required)

**Response** (200 OK):
```json
{
  "success": true
}
```

**Errors**:
- 404: Environment not found

---

## SDK Keys

### Create SDK Key

```text
POST /api/v1/organizations/:organizationId/environments/:envId/sdk-keys
```

**Path Parameters**:
- `organizationId`: UUID (required)
- `envId`: UUID (required)

**Request Body**:
```json
{
  "name": "string (1-255 chars, required)",
  "type": "'client' | 'server' (required)"
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "name": "string",
  "type": "'client' | 'server'",
  "keyHint": "string (6-8 chars)",
  "rawKey": "string (ONLY RETURNED ONCE)",
  "isActive": true,
  "createdAt": "ISO 8601 timestamp"
}
```

**Notes**:
- The `rawKey` is only returned in this response and will NEVER be shown again.
- Clients MUST store this key securely.

---

### List SDK Keys

```text
GET /api/v1/organizations/:organizationId/environments/:envId/sdk-keys
```

**Path Parameters**:
- `organizationId`: UUID (required)
- `envId`: UUID (required)

**Response** (200 OK):
```json
{
  "sdkKeys": [
    {
      "id": "uuid",
      "name": "string",
      "type": "'client' | 'server'",
      "keyHint": "string",
      "isActive": "boolean",
      "createdAt": "ISO 8601 timestamp"
    }
  ]
}
```

---

### Revoke SDK Key (Soft Delete)

```text
DELETE /api/v1/organizations/:organizationId/environments/:envId/sdk-keys/:keyId
```

**Path Parameters**:
- `organizationId`: UUID (required)
- `envId`: UUID (required)
- `keyId`: UUID (required)

**Response** (200 OK):
```json
{
  "success": true
}
```

---

## Feature Flags

### Create Feature Flag

```text
POST /api/v1/organizations/:organizationId/projects/:projectId/environments/:envId/flags
```

**Path Parameters**:
- `organizationId`: UUID (required)
- `projectId`: UUID (required)
- `envId`: UUID (required)

**Request Body**:
```json
{
  "key": "string (1-255 chars, alphanumeric + hyphens + underscores, required)",
  "name": "string (1-255 chars, required)",
  "description": "string (optional)",
  "flagType": "'boolean' | 'multivariate' (required)",
  "variations": [
    {
      "key": "string (1-100 chars, required)",
      "value": "boolean | string | object (required, must match flagType)",
      "description": "string (optional)",
      "isDefault": "boolean (optional, default: false)"
    }
  ]
}
```

**Notes**:
- If `flagType` is `boolean` and `variations` is omitted, system auto-creates `true` and `false` variations (with `false` as default).
- Exactly one variation MUST have `isDefault: true`.

**Response** (201 Created):
```json
{
  "id": "uuid",
  "key": "string",
  "name": "string",
  "description": "string | null",
  "flagType": "'boolean' | 'multivariate'",
  "status": "'draft'",
  "isEnabled": false,
  "variations": [
    {
      "id": "uuid",
      "key": "string",
      "value": "boolean | string | object",
      "isDefault": "boolean"
    }
  ],
  "createdAt": "ISO 8601 timestamp",
  "updatedAt": "ISO 8601 timestamp"
}
```

**Errors**:
- 400: Validation error (invalid fields, variation type mismatch)
- 404: Environment not found
- 409: Flag key already exists within environment

---

### List Feature Flags

```text
GET /api/v1/organizations/:organizationId/projects/:projectId/environments/:envId/flags
```

**Path Parameters**:
- `organizationId`: UUID (required)
- `projectId`: UUID (required)
- `envId`: UUID (required)

**Query Parameters**:
- `status`: `'draft' | 'active' | 'archived'` (optional filter)

**Response** (200 OK):
```json
{
  "flags": [
    {
      "id": "uuid",
      "key": "string",
      "name": "string",
      "description": "string | null",
      "flagType": "'boolean' | 'multivariate'",
      "status": "'draft' | 'active' | 'archived'",
      "isEnabled": "boolean",
      "createdAt": "ISO 8601 timestamp",
      "updatedAt": "ISO 8601 timestamp"
    }
  ],
  "total": "integer"
}
```

---

### Get Feature Flag

```text
GET /api/v1/organizations/:organizationId/flags/:flagId
```

**Path Parameters**:
- `organizationId`: UUID (required)
- `flagId`: UUID (required)

**Response** (200 OK):
```json
{
  "id": "uuid",
  "key": "string",
  "name": "string",
  "description": "string | null",
  "flagType": "'boolean' | 'multivariate'",
  "status": "'draft' | 'active' | 'archived'",
  "isEnabled": "boolean",
  "variations": [
    {
      "id": "uuid",
      "key": "string",
      "value": "boolean | string | object",
      "description": "string | null",
      "isDefault": "boolean"
    }
  ],
  "targetingRules": [
    {
      "id": "uuid",
      "ruleType": "'kill_switch' | 'user' | 'role' | 'percentage'",
      "priority": "string",
      "variationId": "uuid",
      "conditions": "object",
      "isEnabled": "boolean"
    }
  ],
  "version": "integer",
  "createdAt": "ISO 8601 timestamp",
  "updatedAt": "ISO 8601 timestamp"
}
```

**Errors**:
- 404: Flag not found

---

### Update Feature Flag

```text
PATCH /api/v1/organizations/:organizationId/flags/:flagId
```

**Path Parameters**:
- `organizationId`: UUID (required)
- `flagId`: UUID (required)

**Request Body** (all fields optional):
```json
{
  "name": "string (1-255 chars)",
  "description": "string",
  "isEnabled": "boolean",
  "status": "'draft' | 'active' | 'archived'",
  "version": "integer (required for optimistic locking)"
}
```

**Notes**:
- `version` field is required for optimistic locking. Must match current version.
- Status transitions are validated: only `draft → active` and `active → archived` are allowed.

**Response** (200 OK):
```json
{
  "id": "uuid",
  "key": "string",
  "name": "string",
  "description": "string | null",
  "status": "'draft' | 'active' | 'archived'",
  "isEnabled": "boolean",
  "version": "integer",
  "updatedAt": "ISO 8601 timestamp"
}
```

**Errors**:
- 400: Validation error, invalid status transition
- 404: Flag not found
- 409: Version conflict (optimistic locking failure)

---

### Delete Feature Flag

```text
DELETE /api/v1/organizations/:organizationId/flags/:flagId
```

**Path Parameters**:
- `organizationId`: UUID (required)
- `flagId`: UUID (required)

**Response** (200 OK):
```json
{
  "success": true
}
```

**Errors**:
- 403: Only ADMIN role can delete flags
- 404: Flag not found

---

## Targeting Rules

### Create Targeting Rule

```text
POST /api/v1/organizations/:organizationId/flags/:flagId/rules
```

**Path Parameters**:
- `organizationId`: UUID (required)
- `flagId`: UUID (required)

**Request Body**:
```json
{
  "ruleType": "'kill_switch' | 'user' | 'role' | 'percentage' (required)",
  "variationId": "uuid (required, must belong to this flag)",
  "conditions": {
    "userIds": ["string"]  // for ruleType: 'user'
    // OR
    "roles": ["string"]    // for ruleType: 'role'
    // OR
    "percentage": 30       // for ruleType: 'percentage' (0-100)
    // OR
    {}                     // for ruleType: 'kill_switch'
  },
  "isEnabled": "boolean (optional, default: true)"
}
```

**Notes**:
- Priority is auto-assigned using fractional indexing (lexicographical ordering).
- Only one kill_switch rule per flag is allowed.

**Response** (201 Created):
```json
{
  "id": "uuid",
  "ruleType": "'kill_switch' | 'user' | 'role' | 'percentage'",
  "priority": "string",
  "variationId": "uuid",
  "conditions": "object",
  "isEnabled": "boolean",
  "createdAt": "ISO 8601 timestamp",
  "updatedAt": "ISO 8601 timestamp"
}
```

**Errors**:
- 400: Validation error, invalid conditions for ruleType
- 404: Flag not found
- 409: Kill switch rule already exists for this flag

---

### List Targeting Rules

```text
GET /api/v1/organizations/:organizationId/flags/:flagId/rules
```

**Path Parameters**:
- `organizationId`: UUID (required)
- `flagId`: UUID (required)

**Response** (200 OK):
```json
{
  "rules": [
    {
      "id": "uuid",
      "ruleType": "'kill_switch' | 'user' | 'role' | 'percentage'",
      "priority": "string",
      "variationId": "uuid",
      "conditions": "object",
      "isEnabled": "boolean",
      "createdAt": "ISO 8601 timestamp",
      "updatedAt": "ISO 8601 timestamp"
    }
  ],
  "total": "integer"
}
```

**Notes**: Rules are returned sorted by priority (lexicographical).

---

### Get Targeting Rule

```text
GET /api/v1/organizations/:organizationId/flags/:flagId/rules/:ruleId
```

**Path Parameters**:
- `organizationId`: UUID (required)
- `flagId`: UUID (required)
- `ruleId`: UUID (required)

**Response** (200 OK):
```json
{
  "id": "uuid",
  "ruleType": "'kill_switch' | 'user' | 'role' | 'percentage'",
  "priority": "string",
  "variationId": "uuid",
  "conditions": "object",
  "isEnabled": "boolean",
  "createdAt": "ISO 8601 timestamp",
  "updatedAt": "ISO 8601 timestamp"
}
```

**Errors**:
- 404: Rule not found

---

### Update Targeting Rule

```text
PATCH /api/v1/organizations/:organizationId/flags/:flagId/rules/:ruleId
```

**Path Parameters**:
- `organizationId`: UUID (required)
- `flagId`: UUID (required)
- `ruleId`: UUID (required)

**Request Body** (all fields optional):
```json
{
  "variationId": "uuid",
  "conditions": "object",
  "isEnabled": "boolean",
  "priority": "string (for re-ordering)"
}
```

**Response** (200 OK):
```json
{
  "id": "uuid",
  "ruleType": "'kill_switch' | 'user' | 'role' | 'percentage'",
  "priority": "string",
  "variationId": "uuid",
  "conditions": "object",
  "isEnabled": "boolean",
  "updatedAt": "ISO 8601 timestamp"
}
```

**Errors**:
- 400: Validation error
- 403: Insufficient role (requires ADMIN or EDITOR)
- 404: Rule not found

---

### Delete Targeting Rule

```text
DELETE /api/v1/organizations/:organizationId/flags/:flagId/rules/:ruleId
```

**Path Parameters**:
- `organizationId`: UUID (required)
- `flagId`: UUID (required)
- `ruleId`: UUID (required)

**Response** (200 OK):
```json
{
  "success": true
}
```

**Errors**:
- 403: Insufficient role (requires ADMIN or EDITOR)
- 404: Rule not found

---

## Audit Logs

### List Audit Logs

```text
GET /api/v1/organizations/:organizationId/audit-logs
```

**Path Parameters**:
- `organizationId`: UUID (required)

**Query Parameters**:
- `projectId`: UUID (optional, filter by project)
- `entityType`: enum (optional, filter by entity type)
- `actionType`: enum (optional, filter by action type)
- `from`: ISO 8601 timestamp (optional, start date)
- `to`: ISO 8601 timestamp (optional, end date)
- `limit`: integer (optional, default 50, max 200)
- `offset`: integer (optional, default 0)

**Response** (200 OK):
```json
{
  "logs": [
    {
      "id": "uuid",
      "organizationId": "uuid",
      "projectId": "uuid | null",
      "actionType": "enum (detailed)",
      "entityType": "'organization' | 'project' | 'environment' | 'sdk_key' | 'feature_flag' | 'targeting_rule' | 'variation'",
      "entityId": "uuid",
      "actorId": "string",
      "actorType": "'user' | 'system'",
      "actorEmail": "string",
      "changes": {
        "before": "object | null",
        "after": "object | null"
      },
      "timestamp": "ISO 8601 timestamp"
    }
  ],
  "total": "integer",
  "limit": "integer",
  "offset": "integer"
}
```

---

### Get Audit Log Entry

```text
GET /api/v1/organizations/:organizationId/audit-logs/:logId
```

**Path Parameters**:
- `organizationId`: UUID (required)
- `logId`: UUID (required)

**Response** (200 OK):
```json
{
  "id": "uuid",
  "organizationId": "uuid",
  "projectId": "uuid | null",
  "actionType": "enum (detailed)",
  "entityType": "string",
  "entityId": "uuid",
  "actorId": "string",
  "actorType": "'user' | 'system'",
  "actorEmail": "string",
  "changes": {
    "before": "object | null",
    "after": "object | null"
  },
  "timestamp": "ISO 8601 timestamp"
}
```

**Errors**:
- 404: Audit log entry not found

---

## Error Response Format

All error responses follow this format:

```json
{
  "statusCode": "integer",
  "error": "string (error type)",
  "message": "string (human-readable description)",
  "details": "object | array (optional, validation errors)"
}
```

**Common Error Codes**:
- 400: Bad Request (validation error)
- 401: Unauthorized (missing or invalid session)
- 403: Forbidden (insufficient permissions or not a member of organization)
- 404: Not Found
- 409: Conflict (duplicate key, version conflict, invalid state transition)
- 500: Internal Server Error
