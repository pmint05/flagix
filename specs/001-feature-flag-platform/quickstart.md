# Quickstart: Feature Flag Platform (Phase 1)

**Feature**: 001-feature-flag-platform
**Date**: 2026-06-07

This guide provides runnable validation scenarios to verify the Feature Flag Platform backend works end-to-end after implementation.

## Prerequisites

- Node.js 20+ LTS installed
- pnpm 10.x installed globally
- Docker installed and running
- Repository cloned and dependencies installed (`pnpm install`)

## Setup

### 1. Start PostgreSQL

```bash
pnpm db:up
```

**Expected**: Docker container `flagix_postgres` starts and PostgreSQL is accessible on port 5432.

**Verify**:
```bash
pnpm db:logs
```
Should show PostgreSQL startup logs ending with "database system is ready to accept connections".

### 2. Generate Better Auth Schema

```bash
cd apps/backend
npx @better-auth/cli generate --output src/db/auth-schema.ts
```

**Expected**: `auth-schema.ts` is generated with Drizzle schema definitions for `user`, `session`, `account`, and `verification` tables.

### 3. Run Database Migrations

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

**Expected**: All migration files are applied. Tables created: `user`, `session`, `account`, `verification` (Better Auth), `organizations`, `organization_members`, `projects`, `environments`, `feature_flags`, `variations`, `targeting_rules`, `audit_logs` (platform).

### 4. Start Backend Server

```bash
pnpm --filter backend start:dev
```

**Expected**: NestJS application starts on `http://localhost:3000`. Console shows "Nest application successfully started". Better Auth routes mounted at `/api/auth/*`.

---

## Validation Scenarios

### Scenario 0: Authentication & Session Management

**Purpose**: Verify Better Auth integration, user registration, login, and session-based route protection (US8, US9, FR-067 to FR-088)

**Steps**:

1. Register a new user:
```bash
curl -X POST http://localhost:3000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"name": "Admin User", "email": "admin@flagix.dev", "password": "securepass123"}'
```

**Expected**: 200 response with user object and session. Session cookie saved in `cookies.txt`. A default organization is created with the user as ADMIN.

2. Verify session is valid:
```bash
curl http://localhost:3000/api/auth/get-session \
  -b cookies.txt
```

**Expected**: 200 response with user and session details.

3. Verify unauthenticated access is rejected:
```bash
curl http://localhost:3000/api/v1/projects
```

**Expected**: 401 Unauthorized — no session cookie provided.

4. Access protected route with session:
```bash
curl http://localhost:3000/api/v1/projects \
  -b cookies.txt
```

**Expected**: 200 response with projects list (scoped to the user's organization).

5. Sign out and verify session is invalidated:
```bash
curl -X POST http://localhost:3000/api/auth/sign-out \
  -b cookies.txt

curl http://localhost:3000/api/v1/projects \
  -b cookies.txt
```

**Expected**: Sign-out returns 200. Subsequent request returns 401 (session invalidated).

---

### Scenario 1: Organization & Project Setup

**Purpose**: Verify multi-tenant foundation (US1, FR-001 to FR-006)

**Prerequisites**: Authenticate first (Scenario 0) and use session cookie.

**Steps**:

1. Create a project:
```bash
curl -X POST http://localhost:3000/api/v1/projects \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"name": "My App", "description": "Test project"}'
```

**Expected**: 201 response with project object containing `id`, `name`, `slug`, `organizationId`.

2. List projects:
```bash
curl http://localhost:3000/api/v1/projects \
  -b cookies.txt
```

**Expected**: 200 response with `projects` array containing the created project.

3. Create an environment:
```bash
curl -X POST http://localhost:3000/api/v1/projects/<projectId>/environments \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"name": "Development"}'
```

**Expected**: 201 response with environment object including `sdkKey`.

---

### Scenario 2: Feature Flag Lifecycle

**Purpose**: Verify flag creation, lifecycle transitions, and variation model (US2, US3, FR-007 to FR-019)

**Steps**:

1. Create a boolean feature flag:
```bash
curl -X POST http://localhost:3000/api/v1/projects/<projectId>/environments/<envId>/flags \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "key": "dark-mode",
    "name": "Dark Mode",
    "flagType": "boolean",
    "defaultVariationKey": "false"
  }'
```

**Expected**: 201 response with flag in `draft` status, `isEnabled: false`, auto-created `true` and `false` variations.

2. Activate the flag:
```bash
curl -X PATCH http://localhost:3000/api/v1/projects/<projectId>/environments/<envId>/flags/<flagId> \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"status": "active", "isEnabled": true, "version": 1}'
```

**Expected**: 200 response with `status: "active"`, `isEnabled: true`, `version: 2`.

3. Verify invalid transition is rejected:
```bash
curl -X PATCH http://localhost:3000/api/v1/projects/<projectId>/environments/<envId>/flags/<flagId> \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"status": "draft", "version": 2}'
```

**Expected**: 400 response — backward transitions are not allowed.

---

### Scenario 3: Targeting Rules

**Purpose**: Verify rule creation and priority ordering (US4, FR-020 to FR-028)

**Steps**:

1. Create a USER targeting rule:
```bash
curl -X POST http://localhost:3000/api/v1/projects/<projectId>/environments/<envId>/flags/<flagId>/rules \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "ruleType": "user",
    "variationId": "<trueVariationId>",
    "conditions": {"userIds": ["user-123", "user-456"]}
  }'
```

**Expected**: 201 response with rule object, `priority` in range 100-199.

2. Create a PERCENTAGE rollout rule:
```bash
curl -X POST http://localhost:3000/api/v1/projects/<projectId>/environments/<envId>/flags/<flagId>/rules \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "ruleType": "percentage",
    "variationId": "<trueVariationId>",
    "conditions": {"percentage": 50}
  }'
```

**Expected**: 201 response with `priority` in range 300-399.

3. List rules and verify ordering:
```bash
curl http://localhost:3000/api/v1/projects/<projectId>/environments/<envId>/flags/<flagId>/rules \
  -b cookies.txt
```

**Expected**: Rules returned sorted by priority (USER rule before PERCENTAGE rule).

---

### Scenario 4: Flag Evaluation

**Purpose**: Verify deterministic evaluation engine (US5, FR-029 to FR-037)

**Steps**:

1. Evaluate for targeted user:
```bash
curl -X POST http://localhost:3000/api/v1/evaluate \
  -H "Content-Type: application/json" \
  -H "X-SDK-Key: <sdkKey>" \
  -d '{
    "flagKey": "dark-mode",
    "context": {"userId": "user-123", "role": "viewer"}
  }'
```

**Expected**: 200 response with `enabled: true`, `resolvedValue: true`, `evaluationReason: "USER_TARGETING"`.

2. Evaluate for non-targeted user:
```bash
curl -X POST http://localhost:3000/api/v1/evaluate \
  -H "Content-Type: application/json" \
  -H "X-SDK-Key: <sdkKey>" \
  -d '{
    "flagKey": "dark-mode",
    "context": {"userId": "user-999", "role": "viewer"}
  }'
```

**Expected**: 200 response — may match PERCENTAGE or DEFAULT rule depending on hash bucket.

3. Verify determinism (run same request twice):
```bash
curl -X POST http://localhost:3000/api/v1/evaluate \
  -H "Content-Type: application/json" \
  -H "X-SDK-Key: <sdkKey>" \
  -d '{
    "flagKey": "dark-mode",
    "context": {"userId": "user-999", "role": "viewer"}
  }'
```

**Expected**: Identical response both times (same `variationKey`, `resolvedValue`, `evaluationReason`).

4. Evaluate for anonymous user (no userId):
```bash
curl -X POST http://localhost:3000/api/v1/evaluate \
  -H "Content-Type: application/json" \
  -H "X-SDK-Key: <sdkKey>" \
  -d '{
    "flagKey": "dark-mode",
    "context": {"role": "viewer"}
  }'
```

**Expected**: USER and PERCENTAGE rules skipped. Returns DEFAULT variation.

5. Evaluate non-existent flag:
```bash
curl -X POST http://localhost:3000/api/v1/evaluate \
  -H "Content-Type: application/json" \
  -H "X-SDK-Key: <sdkKey>" \
  -d '{
    "flagKey": "non-existent-flag",
    "context": {"userId": "user-123"}
  }'
```

**Expected**: 200 response with `enabled: false`, `evaluationReason: "FLAG_NOT_FOUND"`. Fail-safe behavior confirmed.

---

### Scenario 5: Kill Switch

**Purpose**: Verify kill switch short-circuits all rules (FR-023a, FR-023b)

**Steps**:

1. Create a kill switch rule:
```bash
curl -X POST http://localhost:3000/api/v1/projects/<projectId>/environments/<envId>/flags/<flagId>/rules \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "ruleType": "kill_switch",
    "variationId": "<falseVariationId>",
    "conditions": {}
  }'
```

**Expected**: 201 response with `priority: 0`.

2. Evaluate any user:
```bash
curl -X POST http://localhost:3000/api/v1/evaluate \
  -H "Content-Type: application/json" \
  -H "X-SDK-Key: <sdkKey>" \
  -d '{
    "flagKey": "dark-mode",
    "context": {"userId": "user-123", "role": "admin"}
  }'
```

**Expected**: `enabled: false`, `resolvedValue: false`, `evaluationReason: "KILL_SWITCH"`. Even though user-123 has a USER targeting rule, the kill switch takes priority.

---

### Scenario 6: Audit Log

**Purpose**: Verify audit log recording (US5, FR-061 to FR-066)

**Steps**:

1. Query audit logs after previous operations:
```bash
curl "http://localhost:3000/api/v1/audit-logs?flagId=<flagId>&limit=10" \
  -b cookies.txt
```

**Expected**: 200 response with audit log entries for: flag creation, status update, rule creation, kill switch creation. Each entry includes `actionType`, `entityType`, `entityId`, `actorId`, `timestamp`, and `changes`.

---

### Scenario 7: RBAC Enforcement

**Purpose**: Verify role-based access control (US6, FR-038 to FR-044)

**Steps**:

1. Attempt flag deletion with EDITOR role:
```bash
curl -X DELETE http://localhost:3000/api/v1/projects/<projectId>/environments/<envId>/flags/<flagId> \
  -b editor-cookies.txt \
```

**Expected**: 403 Forbidden — only ADMIN can delete flags.

2. Attempt rule deletion with EDITOR role:
```bash
curl -X DELETE http://localhost:3000/api/v1/projects/<projectId>/environments/<envId>/flags/<flagId>/rules/<ruleId> \
  -b editor-cookies.txt \
```

**Expected**: 200 OK — EDITORs can delete targeting rules.

---

## Running Tests

### Unit Tests

```bash
pnpm --filter backend test
```

**Expected**: All unit tests pass, including evaluation engine determinism tests.

### E2E Tests

```bash
pnpm --filter backend test:e2e
```

**Expected**: All end-to-end tests pass, covering full API workflows.

### Type Check

```bash
pnpm typecheck
```

**Expected**: No TypeScript errors across the monorepo.

### Lint

```bash
pnpm lint
```

**Expected**: No linting errors.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| PostgreSQL not starting | Run `pnpm db:down` then `pnpm db:up` to restart |
| Migration fails | Check `apps/backend/.env` has correct `DATABASE_URL` |
| Backend won't start | Ensure port 3000 is available, check `apps/backend/.env` |
| 401 on all requests | Verify admin/SDK keys are set in `.env` and match request headers |
| Evaluation returns wrong result | Check rule priorities and conditions via GET rules endpoint |
