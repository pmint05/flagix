# Evaluation API Contracts

**Feature**: 001-feature-flag-platform
**Base URL**: `/api/v1`
**Authentication**: SDK Key (header: `X-SDK-Key`)
**Content-Type**: `application/json`

The Evaluation API is used by SDKs and demo applications to evaluate feature flags for specific users. SDK keys are read-only and scoped to a single environment.

---

## Evaluate Single Flag

### POST /api/v1/evaluate

Evaluate a single feature flag for a given user context.

**Authentication**: SDK Key (header: `X-SDK-Key`, environment-scoped, read-only)

**Request Body**:
```json
{
  "flagKey": "string (required)",
  "context": {
    "userId": "string (optional, omit for anonymous users)",
    "role": "string (optional)",
    "attributes": {
      "key": "string | number | boolean (optional, extensible)"
    }
  }
}
```

**Validation Rules**:
- `flagKey`: required, non-empty string
- `context`: required object
- `context.userId`: optional string (if omitted, treated as anonymous)
- `context.role`: optional string
- `context.attributes`: optional object with string keys and primitive values

**Response** (200 OK):
```json
{
  "flagKey": "string",
  "enabled": "boolean",
  "variationKey": "string",
  "resolvedValue": "boolean | string | object",
  "evaluationReason": "string"
}
```

**Response Fields**:
- `flagKey`: The flag that was evaluated
- `enabled`: Whether the flag is active (true) or returning safe default (false)
- `variationKey`: The key of the variation that was selected
- `resolvedValue`: The resolved output value of the selected variation
- `evaluationReason`: Human-readable explanation of the decision path

**Evaluation Reason Values**:
| Reason | Description |
|--------|-------------|
| `KILL_SWITCH` | Kill switch rule matched, returned OFF |
| `USER_TARGETING` | User-specific targeting rule matched |
| `ROLE_TARGETING` | Role-based targeting rule matched |
| `PERCENTAGE_ROLLOUT` | Percentage rollout rule matched via deterministic hash |
| `DEFAULT` | No rule matched, returned default variation |
| `FLAG_NOT_FOUND` | Flag key does not exist, returned safe default |
| `FLAG_ARCHIVED` | Flag is archived, returned safe default |
| `FLAG_DRAFT` | Flag is in draft state, returned safe default |
| `FLAG_DISABLED` | Flag isEnabled is false, returned safe default |
| `EVALUATION_ERROR` | Internal error occurred, returned safe default |

**Error Response** (fail-safe):
```json
{
  "flagKey": "string",
  "enabled": false,
  "variationKey": "string (default variation key)",
  "resolvedValue": "boolean | string | object (default variation value)",
  "evaluationReason": "EVALUATION_ERROR | FLAG_NOT_FOUND"
}
```

**Notes**:
- The evaluation API NEVER returns HTTP error codes for evaluation failures.
- All failures result in a 200 OK response with safe default values (fail-safe principle).
- HTTP 401 is only returned for invalid/missing SDK keys.
- HTTP 400 is only returned for malformed request bodies (not evaluation errors).

---

## Evaluate All Flags

### POST /api/v1/evaluate/all

Evaluate all active feature flags in the environment for a given user context.

**Authentication**: SDK Key (header: `X-SDK-Key`, environment-scoped, read-only)

**Request Body**:
```json
{
  "context": {
    "userId": "string (optional, omit for anonymous users)",
    "role": "string (optional)",
    "attributes": {
      "key": "string | number | boolean (optional, extensible)"
    }
  }
}
```

**Response** (200 OK):
```json
{
  "flags": [
    {
      "flagKey": "string",
      "enabled": "boolean",
      "variationKey": "string",
      "resolvedValue": "boolean | string | object",
      "evaluationReason": "string"
    }
  ]
}
```

**Notes**:
- Only evaluates flags with `status: 'active'`.
- Draft and archived flags are excluded from the response.
- Each flag is evaluated independently using the same context.
- Individual flag evaluation failures return safe defaults for that flag without affecting other flags.

---

## Evaluation Flow (Logical)

The evaluation engine processes each request through this strict sequence:

```text
1. Load feature flag by flagKey + environment (from SDK key)
2. If flag not found → return OFF with reason FLAG_NOT_FOUND
3. If flag status is 'archived' → return OFF with reason FLAG_ARCHIVED
4. If flag status is 'draft' → return OFF with reason FLAG_DRAFT
5. If flag isEnabled is false → return OFF with reason FLAG_DISABLED
6. Check KILL SWITCH rules → if matched, return OFF with reason KILL_SWITCH
7. Evaluate USER rules → if matched, return variation with reason USER_TARGETING
8. Evaluate ROLE rules → if matched, return variation with reason ROLE_TARGETING
9. Evaluate PERCENTAGE rules → if matched, return variation with reason PERCENTAGE_ROLLOUT
10. Return default variation with reason DEFAULT
```

**Anonymous User Handling** (missing userId):
- USER rules are skipped
- PERCENTAGE rules are skipped
- ROLE and DEFAULT rules are evaluated normally

**Missing Role Handling**:
- ROLE rules are skipped
- Other rules are evaluated normally

**Invalid Attributes Handling**:
- Invalid attributes are ignored silently
- Evaluation continues without failure

---

## Determinism Guarantee

For any given combination of:
- flagKey
- userId
- role
- attributes
- flag configuration (rules + variations)

The evaluation result is ALWAYS identical across multiple requests. This is guaranteed by:
- MurmurHash3 (x86, 32-bit) for percentage rollout bucketing
- Deterministic rule priority ordering (KILL SWITCH > USER > ROLE > PERCENTAGE > DEFAULT)
- Deterministic tie-breaking by rule ID order for same-priority rules
- No randomness or external state dependencies in the evaluation engine

---

## Error Response Format

HTTP-level errors (only for authentication/validation failures):

```json
{
  "statusCode": "integer",
  "error": "string",
  "message": "string"
}
```

**HTTP Error Codes**:
- 401: Invalid or missing SDK key
- 400: Malformed request body (missing flagKey, invalid context structure)

**Evaluation-level errors** are NEVER returned as HTTP errors. They are handled via the fail-safe mechanism and returned as 200 OK with safe default values.
