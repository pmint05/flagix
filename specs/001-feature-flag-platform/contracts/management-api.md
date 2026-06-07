# Management API Contracts

**Feature**: 001-feature-flag-platform
**Base URL**: `/api/v1`
**Authentication**: Better Auth session (cookie-based). All management routes are protected by the global AuthGuard. Unauthenticated requests receive HTTP 401.
**Content-Type**: `application/json`

All management APIs require a valid Better Auth session and are scoped to an organization via the authenticated user's OrganizationMember membership.

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

## Session Guard (NestJS Middleware)

All management API routes (`/api/v1/*`) are protected by Better Auth's global `AuthGuard` provided by `@thallesp/nestjs-better-auth`.

**Behavior**:
- Every request to `/api/v1/*` endpoints MUST include a valid Better Auth session cookie.
- The AuthGuard validates the session against the database before the request reaches the controller.
- If the session is invalid or missing, the request is rejected with HTTP 401 Unauthorized.
- The `@Session()` decorator injects the authenticated user's session into controller parameters.

**Route protection decorators**:

| Decorator | Purpose |
|-----------|---------|
| `@Session()` | Injects the user session into a controller parameter |
| `@AllowAnonymous()` | Marks a route as public (no auth required) |
| `@OrgRoles('admin')` | Requires ADMIN role in the target organization |
| `@OrgRoles('editor')` | Requires EDITOR or ADMIN role in the target organization |

**Evaluation API exception**: Evaluation API routes (`/api/v1/evaluate`, `/api/v1/evaluate/all`) use SDK key authentication (not session cookies). These routes are marked with `@AllowAnonymous()` and use a custom `SdkKeyGuard` for SDK key validation.

---

## Projects

### Create Project

```text
POST /api/v1/projects
```

**Request Body**:
```json
{
  "name": "string (1-255 chars, required)",
  "slug": "string (1-100 chars, optional, auto-generated from name)",
  "description": "string (optional)"
}
```

**Notes**: The authenticated user's organization is determined from their session and active organization context.

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
- 400: Validation error (missing/invalid fields)
- 409: Slug already exists within organization

---

### List Projects

```text
GET /api/v1/projects
```

**Query Parameters**: None (scoped to authenticated organization)

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
GET /api/v1/projects/:projectId
```

**Path Parameters**:
- `projectId`: UUID (required)

**Response** (200 OK):
```json
{
  "id": "uuid",
  "name": "string",
  "slug": "string",
  "description": "string | null",
  "organizationId": "uuid",
  "environments": [
    {
      "id": "uuid",
      "name": "string",
      "slug": "string"
    }
  ],
  "createdAt": "ISO 8601 timestamp",
  "updatedAt": "ISO 8601 timestamp"
}
```

**Errors**:
- 404: Project not found

---

### Update Project

```text
PATCH /api/v1/projects/:projectId
```

**Path Parameters**:
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
- 404: Project not found

---

### Delete Project

```text
DELETE /api/v1/projects/:projectId
```

**Path Parameters**:
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
POST /api/v1/projects/:projectId/environments
```

**Path Parameters**:
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
  "sdkKey": "string (only returned on creation)",
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
GET /api/v1/projects/:projectId/environments
```

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

## Feature Flags

### Create Feature Flag

```text
POST /api/v1/projects/:projectId/environments/:envId/flags
```

**Path Parameters**:
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
      "description": "string (optional)"
    }
  ],
  "defaultVariationKey": "string (required, must match one of the variation keys)"
}
```

**Notes**:
- If `flagType` is `boolean` and `variations` is omitted, system auto-creates `true` and `false` variations.
- `defaultVariationKey` must reference one of the provided variation keys.

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
  "defaultVariationId": "uuid",
  "variations": [
    {
      "id": "uuid",
      "key": "string",
      "value": "boolean | string | object"
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
GET /api/v1/projects/:projectId/environments/:envId/flags
```

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
      "defaultVariationId": "uuid",
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
GET /api/v1/projects/:projectId/environments/:envId/flags/:flagId
```

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
  "defaultVariationId": "uuid",
  "variations": [
    {
      "id": "uuid",
      "key": "string",
      "value": "boolean | string | object",
      "description": "string | null"
    }
  ],
  "targetingRules": [
    {
      "id": "uuid",
      "ruleType": "'kill_switch' | 'user' | 'role' | 'percentage'",
      "priority": "integer",
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
PATCH /api/v1/projects/:projectId/environments/:envId/flags/:flagId
```

**Request Body** (all fields optional):
```json
{
  "name": "string (1-255 chars)",
  "description": "string",
  "isEnabled": "boolean",
  "status": "'draft' | 'active' | 'archived'",
  "defaultVariationId": "uuid",
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
DELETE /api/v1/projects/:projectId/environments/:envId/flags/:flagId
```

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
POST /api/v1/projects/:projectId/environments/:envId/flags/:flagId/rules
```

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
- Priority is auto-assigned based on ruleType (kill_switch=0, user=100+, role=200+, percentage=300+).
- Only one kill_switch rule per flag is allowed.

**Response** (201 Created):
```json
{
  "id": "uuid",
  "ruleType": "'kill_switch' | 'user' | 'role' | 'percentage'",
  "priority": "integer",
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
GET /api/v1/projects/:projectId/environments/:envId/flags/:flagId/rules
```

**Response** (200 OK):
```json
{
  "rules": [
    {
      "id": "uuid",
      "ruleType": "'kill_switch' | 'user' | 'role' | 'percentage'",
      "priority": "integer",
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

**Notes**: Rules are returned sorted by priority (ascending).

---

### Update Targeting Rule

```text
PATCH /api/v1/projects/:projectId/environments/:envId/flags/:flagId/rules/:ruleId
```

**Request Body** (all fields optional):
```json
{
  "variationId": "uuid",
  "conditions": "object",
  "isEnabled": "boolean"
}
```

**Response** (200 OK):
```json
{
  "id": "uuid",
  "ruleType": "'kill_switch' | 'user' | 'role' | 'percentage'",
  "priority": "integer",
  "variationId": "uuid",
  "conditions": "object",
  "isEnabled": "boolean",
  "updatedAt": "ISO 8601 timestamp"
}
```

**Errors**:
- 400: Validation error
- 404: Rule not found

---

### Delete Targeting Rule

```text
DELETE /api/v1/projects/:projectId/environments/:envId/flags/:flagId/rules/:ruleId
```

**Response** (200 OK):
```json
{
  "success": true
}
```

**Errors**:
- 404: Rule not found

---

## Audit Logs

### List Audit Logs

```text
GET /api/v1/audit-logs
```

**Query Parameters**:
- `flagId`: UUID (optional, filter by feature flag)
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
      "actionType": "'create' | 'update' | 'delete' | 'toggle'",
      "entityType": "'organization' | 'project' | 'environment' | 'feature_flag' | 'targeting_rule' | 'variation'",
      "entityId": "uuid",
      "actorId": "string",
      "actorType": "'user' | 'system'",
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
GET /api/v1/audit-logs/:logId
```

**Response** (200 OK):
```json
{
  "id": "uuid",
  "organizationId": "uuid",
  "projectId": "uuid | null",
  "actionType": "'create' | 'update' | 'delete' | 'toggle'",
  "entityType": "string",
  "entityId": "uuid",
  "actorId": "string",
  "actorType": "'user' | 'system'",
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

## Real-Time Updates (SSE)

### Subscribe to Flag Updates

```text
GET /api/v1/stream/:envId
```

**Authentication**: SDK Key (header: `X-SDK-Key`)

**Response**: Server-Sent Events stream

**Event Types**:

**flag.updated**:
```text
event: flag.updated
data: {"flagKey": "string", "updatedAt": "ISO 8601 timestamp"}
```

**flag.deleted**:
```text
event: flag.deleted
data: {"flagKey": "string"}
```

**heartbeat**:
```text
event: heartbeat
data: {}
```

**Notes**:
- Heartbeat sent every 30 seconds to keep connection alive.
- Clients should implement reconnection with exponential backoff.
- Falls back to polling if SSE connection cannot be established.

---

## Polling Endpoint

### Get All Flags for Environment

```text
GET /api/v1/flags/:envId
```

**Authentication**: SDK Key (header: `X-SDK-Key`)

**Headers**:
- `If-None-Match`: ETag value (optional, for conditional requests)

**Response** (200 OK):
```json
{
  "flags": [
    {
      "key": "string",
      "name": "string",
      "flagType": "'boolean' | 'multivariate'",
      "isEnabled": "boolean",
      "defaultVariation": {
        "key": "string",
        "value": "boolean | string | object"
      },
      "variations": [
        {
          "key": "string",
          "value": "boolean | string | object"
        }
      ],
      "rules": [
        {
          "ruleType": "'kill_switch' | 'user' | 'role' | 'percentage'",
          "priority": "integer",
          "variationKey": "string",
          "conditions": "object",
          "isEnabled": "boolean"
        }
      ]
    }
  ],
  "etag": "string"
}
```

**Response** (304 Not Modified):
- Returned when `If-None-Match` header matches current ETag (no changes since last poll).

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
- 401: Unauthorized (missing or invalid API key)
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 409: Conflict (duplicate key, version conflict, invalid state transition)
- 500: Internal Server Error
