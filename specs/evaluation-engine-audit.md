# Flagix Evaluation Engine Audit

Complete reference for how the flag evaluation engine processes rule types, custom condition types, and operators — frontend to backend.

---

## 1. Rule Types

Defined in `packages/shared/src/schemas/enums.ts:5`:

```ts
ruleTypeEnum = z.enum([
  'kill_switch', 'user', 'role', 'percentage', 'custom', 'segment'
]);
```

### 1.1 Evaluation Order (`MATCHER_TIERS`)

```
user → role → segment → custom → percentage
```

`kill_switch` is evaluated first and independently — if the flag is disabled via kill switch, evaluation short-circuits before any tier runs.

**File:** `apps/backend/src/modules/evaluation/rule-matcher.ts:15-21`

### 1.2 Matcher Registry

All 5 strategies are registered in `ruleMatchers` (line 395–425):

| Priority | Rule Type     | Strategy         | What It Checks                                              |
|----------|---------------|------------------|-------------------------------------------------------------|
| —        | `kill_switch` | `matchesKillSwitch` | `rule.isEnabled === true`                                  |
| 1        | `user`        | `matchesUserRule`    | `context.userId ∈ rule.conditions.userIds`                 |
| 2        | `role`        | `matchesRoleRule`    | `context.role ∈ rule.conditions.roles`                     |
| 3        | `segment`     | `matchesSegmentRule` | `evaluateSegment(rule.conditions, context)`                 |
| 4        | `custom`      | `matchesCustomRule`  | All `rule.conditions.<key>` pass `matchClause` (AND logic) |

---

## 2. Kill Switch (`matchesKillSwitch`)

**File:** `rule-matcher.ts:33-42`

```ts
if (rule.ruleType === 'kill_switch' && rule.isEnabled) {
  return { isMatched: true, value: rule.variation };
}
```

- Returns immediately if the flag is disabled.
- `rule.isEnabled` is a boolean field on the rule document.
- If matched, returns the rule's `variation` as the resolved value.

---

## 3. User Rule (`matchesUserRule`)

**File:** `rule-matcher.ts:44-56`

```ts
if (rule.ruleType !== 'user' || !rule.conditions?.userIds?.length) {
  return { isMatched: false };
}
if (!context.userId) {
  return { isMatched: false };
}
const matched = rule.conditions.userIds.includes(context.userId);
return matched ? { isMatched: true, value: rule.variation } : { isMatched: false };
```

- Checks if `context.userId` is in the `userIds` array of the rule's conditions.
- Requires `userIds` to be non-empty.
- Returns `isMatched: false` if no `context.userId` is provided.

---

## 4. Role Rule (`matchesRoleRule`)

**File:** `rule-matcher.ts:58-78`

```ts
if (rule.ruleType !== 'role' || !rule.conditions?.roles?.length) {
  return { isMatched: false };
}
if (!context.role) {
  return { isMatched: false };
}
const matched = rule.conditions.roles.includes(context.role);
return matched ? { isMatched: true, value: rule.variation } : { isMatched: false };
```

- Checks if `context.role` is in the `roles` array.
- Requires `roles` to be non-empty.
- Returns `isMatched: false` if no `context.role` is provided.

---

## 5. Segment Rule (`matchesSegmentRule` → `evaluateSegment`)

**File:** `rule-matcher.ts:80-106` → `138-268`

### 5.1 `matchesSegmentRule`

```ts
if (rule.ruleType !== 'segment') {
  return { isMatched: false };
}
return evaluateSegment(rule.conditions, context);
```

Directly delegates to `evaluateSegment`.

### 5.2 `evaluateSegment(conditions, context)`

Supports two formats:

#### Legacy format (flat conditions)

```json
{
  "operator": "contains",
  "value": "premium",
  "conditionLogic": "and"
}
```

When this format is detected (`operator && value && !conditions.conditions`):
- Sets `conditionType = 'custom'` (hardcoded)
- Sets `conditions = [conditions]` (wraps in array)
- Evaluates with `matchClause`

#### New format (nested conditions array)

```json
{
  "conditions": [
    { "contextKey": "tier", "type": "string", "operator": "contains", "value": "premium" },
    { "contextKey": "region", "type": "string", "operator": "equals", "value": "US" }
  ],
  "conditionLogic": "and"
}
```

- Reads `conditionLogic` from the conditions root (defaults to `"and"`)
- Reads `conditionType` from the conditions root (defaults to `"custom"`)
- Iterates each condition in `conditions.conditions[]`

### 5.3 Segment Evaluation Flow

```
evaluateSegment(conditions, context)
  │
  ├─ Legacy format detected?
  │   └─ Yes: conditionType='custom', wrap in array, goto evaluateCustom
  │
  ├─ No conditions.conditions[] → return { isMatched: false }
  │
  ├─ For each condition in conditions.conditions[]:
  │   ├─ conditionType === 'user' → matchesUserRule(condition, context)
  │   ├─ conditionType === 'role' → matchesRoleRule(condition, context)
  │   └─ conditionType === 'custom' → matchClause(condition, context)
  │
  ├─ conditionLogic === 'or':
  │   └─ Return first match found (short-circuit)
  │
  └─ conditionLogic === 'and' (default):
      └─ Return true only if ALL conditions matched
```

### 5.4 Segment → Flag Reference Invalidation

When a segment is created/updated/deleted, the backend queries `targeting_rules` joined with `feature_flags`:

```sql
SELECT DISTINCT f.id, f.key, f.environment_id
FROM feature_flags f
INNER JOIN targeting_rules tr ON tr.feature_flag_id = f.id
WHERE tr.rule_type = 'segment'
  AND tr.conditions->'segmentIds' @> to_jsonb(segmentId::text)
```

Then invalidates the Redis cache for each flag's key: `flagix:config:{envId}:flag:{flagKey}` and `flagix:config:{envId}:flags:all`.

---

## 6. Custom Rule (`matchesCustomRule`)

**File:** `rule-matcher.ts:108-136`

### 6.1 Structure

```json
{
  "ruleType": "custom",
  "conditions": {
    "tier": { "contextKey": "tier", "type": "string", "operator": "contains", "value": "premium" },
    "region": { "contextKey": "region", "type": "string", "operator": "equals", "value": "US" }
  }
}
```

Each key in `rule.conditions` is evaluated independently.

### 6.2 Evaluation Flow

```
matchesCustomRule(rule, context)
  │
  ├─ rule.ruleType !== 'custom' → return { isMatched: false }
  ├─ No conditions or empty conditions → return { isMatched: false }
  │
  ├─ For each key in rule.conditions:
  │   └─ matchClause(condition, context)
  │       └─ Returns { isMatched: false } → return immediately (first non-match)
  │
  └─ All conditions passed → return { isMatched: true, value: rule.variation }
```

**AND logic**: ALL conditions must match. Evaluation short-circuits on first failure.

---

## 7. `matchClause` — Core Operator Evaluation

**File:** `rule-matcher.ts:304-393`

This is the central function that evaluates all custom condition types and operators.

### 7.1 Value Resolution

```ts
const clauseValue =
  normalizedOp === 'between' && Array.isArray(clause.values)
    ? clause.values
    : clause.value;

if (clauseValue === undefined || clauseValue === null) {
  return { isMatched: false };
}
```

- For `between` operators: uses `clause.values` (a 2-element array)
- All other operators: uses `clause.value`
- Short-circuits if the resolved value is null/undefined

### 7.2 Value to Test

```ts
const valueToTest = context[clause.contextKey];
if (valueToTest === undefined || valueToTest === null) {
  return { isMatched: false };
}
```

- Looks up `clause.contextKey` in the evaluation context
- Short-circuits if the context value is null/undefined

### 7.3 Type Normalization

For `string` and `semver` types:

```ts
if (clause.type === 'string' || clause.type === 'semver') {
  if (typeof valueToTest === 'string') valueToTest = valueToTest.trim();
  if (typeof clauseValue === 'string') clauseValue = clauseValue.trim();
}
```

For `number` types:

```ts
if (clause.type === 'number') {
  if (typeof valueToTest === 'string') valueToTest = Number(valueToTest);
  if (typeof clauseValue === 'string') clauseValue = Number(clauseValue);
}
```

For `boolean` types:

```ts
if (clause.type === 'boolean') {
  if (typeof valueToTest === 'string') valueToTest = valueToTest === 'true';
  if (typeof clauseValue === 'string') clauseValue = clauseValue === 'true';
}
```

---

## 8. Complete Operator Reference

### 8.1 Frontend `OPERATORS_BY_TYPE` (`constants.ts`)

| Type      | Operators                                                                  |
|-----------|---------------------------------------------------------------------------|
| `string`  | `is_one_of`, `is_not_one_of`, `contains`, `not_contains`, `starts_with`, `ends_with`, `matches_regex` |
| `number`  | `equals`, `not_equals`, `gt`, `gte`, `lt`, `lte`, `between`, `is_one_of`, `is_not_one_of` |
| `boolean` | `equals`, `not_equals`                                                    |
| `object`  | `has_key`, `not_has_key`, `equals_json`                                   |
| `array`   | `contains`, `not_contains`, `contains_any`, `contains_all`, `is_empty`, `is_not_empty` |
| `semver`  | `equals`, `not_equals`, `gt`, `gte`, `lt`, `lte`, `between`, `is_one_of`, `is_not_one_of` |
| `date`    | `before`, `after`, `between`                                              |

**Total: 41 operators across 7 types**

### 8.2 Backend `matchClause` Handlers

#### String

| Operator          | Backend Handler                                        | Notes                              |
|-------------------|--------------------------------------------------------|------------------------------------|
| `equals`          | `valueToTest === clauseValue`                          |                                    |
| `not_equals`      | `valueToTest !== clauseValue`                          |                                    |
| `contains`        | `valueToTest.includes(clauseValue)`                    |                                    |
| `not_contains`    | `!valueToTest.includes(clauseValue)`                   |                                    |
| `starts_with`     | `valueToTest.startsWith(clauseValue)`                  |                                    |
| `ends_with`       | `valueToTest.endsWith(clauseValue)`                    |                                    |
| `matches_regex`   | `new RegExp(clauseValue).test(valueToTest)`            |                                    |
| `is_one_of` / `in` | `clauseValue.includes(valueToTest)`                  | `clauseValue` is the allowed list  |
| `is_not_one_of` / `not_in` | `!clauseValue.includes(valueToTest)`            |                                    |

#### Number

| Operator          | Backend Handler                                        | Notes                              |
|-------------------|--------------------------------------------------------|------------------------------------|
| `equals`          | `valueToTest === clauseValue`                          | After `Number()` conversion        |
| `not_equals`      | `valueToTest !== clauseValue`                          |                                    |
| `gt` / `greater_than` | `valueToTest > clauseValue`                        |                                    |
| `gte`             | `valueToTest >= clauseValue`                           |                                    |
| `lt` / `less_than` | `valueToTest < clauseValue`                         |                                    |
| `lte`             | `valueToTest <= clauseValue`                           |                                    |
| `between`         | `valueToTest >= values[0] && valueToTest <= values[1]` | Uses `clause.values` array         |
| `is_one_of` / `in` | `clauseValue.includes(valueToTest)`                  | `clauseValue` is the allowed list  |
| `is_not_one_of` / `not_in` | `!clauseValue.includes(valueToTest)`            |                                    |

#### Boolean

| Operator     | Backend Handler              |
|--------------|------------------------------|
| `equals`     | `valueToTest === clauseValue`|
| `not_equals` | `valueToTest !== clauseValue`|

#### Object

| Operator      | Backend Handler                              | Notes                          |
|---------------|----------------------------------------------|--------------------------------|
| `has_key`     | `typeof valueToTest === 'object' && valueToTest.hasOwnProperty(clauseValue)` | `clauseValue` is the key name |
| `not_has_key` | `!(typeof valueToTest === 'object' && valueToTest.hasOwnProperty(clauseValue))` | |
| `equals_json` | `JSON.stringify(valueToTest) === JSON.stringify(clauseValue)` | Deep comparison via serialization |

#### Array

| Operator        | Backend Handler                                       | Notes                          |
|-----------------|-------------------------------------------------------|--------------------------------|
| `contains`      | `valueToTest.includes(clauseValue)`                   | Array has exact value          |
| `not_contains`  | `!valueToTest.includes(clauseValue)`                  |                                |
| `contains_any`  | `clauseValue.some(v => valueToTest.includes(v))`      | At least one overlap           |
| `contains_all`  | `clauseValue.every(v => valueToTest.includes(v))`     | `clauseValue` ⊆ `valueToTest` |
| `is_empty`      | `valueToTest.length === 0`                            |                                |
| `is_not_empty`  | `valueToTest.length > 0`                              |                                |

#### Semver

All same as `number` plus `between`:

| Operator          | Backend Handler                                        | Notes                              |
|-------------------|--------------------------------------------------------|------------------------------------|
| `equals`          | `valueToTest === clauseValue`                          | String comparison after trim       |
| `not_equals`      | `valueToTest !== clauseValue`                          |                                    |
| `gt` / `greater_than` | `valueToTest > clauseValue`                        | Lexicographic comparison           |
| `gte`             | `valueToTest >= clauseValue`                           |                                    |
| `lt` / `less_than` | `valueToTest < clauseValue`                         |                                    |
| `lte`             | `valueToTest <= clauseValue`                           |                                    |
| `between`         | `valueToTest >= values[0] && valueToTest <= values[1]` | Lexicographic, uses `values` array |
| `is_one_of` / `in` | `clauseValue.includes(valueToTest)`                  |                                    |
| `is_not_one_of` / `not_in` | `!clauseValue.includes(valueToTest)`            |                                    |

> **Note:** Semver comparison is lexicographic (string comparison), not semantic. `"1.10.0" > "1.9.0"` works correctly via string comparison, but `"1.9.0" > "1.10.0"` is `true` because `"9" > "1"` lexicographically. Consider using a semver library if strict version comparison is needed.

#### Date

| Operator          | Backend Handler                                        | Notes                              |
|-------------------|--------------------------------------------------------|------------------------------------|
| `after` / `greater_than` / `gt` | `valueToTest > clauseValue`                  | `new Date()` comparison           |
| `before` / `less_than` / `lt` | `valueToTest < clauseValue`                  | `new Date()` comparison           |
| `between`         | `valueToTest >= values[0] && valueToTest <= values[1]` | Uses `new Date()` comparison, `values` array |

> **Note:** Date comparison uses JavaScript's `new Date()` constructor. Invalid dates will result in `NaN` comparisons, which always return `false`.

---

## 9. Operator Aliases

The backend normalizes operator names via `normalizedOp` before switching:

```ts
const normalizedOp =
  operator === 'greater_than' || operator === 'in'
    ? operator === 'in' ? 'is_one_of' : 'gt'
    : operator === 'less_than' || operator === 'not_in'
    ? operator === 'not_in' ? 'is_not_one_of' : 'lt'
    : operator;
```

| Frontend Name     | Backend Alias          | Resolves To      |
|-------------------|------------------------|------------------|
| `greater_than`    | `gt`                   | `gt`             |
| `less_than`       | `lt`                   | `lt`             |
| `in`              | `is_one_of`            | `is_one_of`      |
| `not_in`          | `is_not_one_of`        | `is_not_one_of`  |

The frontend only exposes canonical names (`gt`, `lt`, `is_one_of`, `is_not_one_of`). The aliases exist for backward compatibility.

---

## 10. Frontend Schema Validation

**File:** `apps/frontend/src/features/flags/editor/schema.ts`

### 10.1 Custom Condition Schema

```ts
const customConditionSchema = z.object({
  contextKey: z.string().min(1, { message: 'Context Key is required' }),
  type: z.enum(['string', 'number', 'boolean', 'object', 'array', 'semver', 'date']),
  operator: z.string().min(1, { message: 'Operator is required' }),
  values: z.array(z.any()).optional(),
  value: z.any().optional(),
  conditionLogic: z.enum(['and', 'or']).optional(),
});
```

Key points:
- `operator` is a free-form string (no enum restriction at schema level) — validation is handled by `OPERATORS_BY_TYPE` in the UI
- `value` and `values` are both optional at the schema level
- `conditionLogic` defaults to `'and'` in evaluation

### 10.2 Between Validation

```ts
const BETWEEN_OPERATOR = "between";

// In refine:
if (operator === BETWEEN_OPERATOR) {
  if (!values || !Array.isArray(values) || values.length < 2) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: '...' });
  }
  if (values?.[0] === undefined || values?.[0] === null) { ... }
  if (values?.[1] === undefined || values?.[1] === null) { ... }
}
```

Validates that `values` array has at least 2 elements and both `values[0]` and `values[1]` are defined.

---

## 11. End-to-End Evaluation Flow

```
evaluateFlag(flagKey, context, envId)
  │
  ├─ 1. Cache lookup: flagix:config:{envId}:flag:{flagKey}
  │   ├─ Hit → return cached config
  │   └─ Miss → fetch from DB, cache, continue
  │
  ├─ 2. Kill switch check
  │   └─ matchesKillSwitch(rule) → if enabled, return rule.variation immediately
  │
  ├─ 3. Tier-based evaluation (MATCHER_TIERS)
  │   ├─ user rule  → matchesUserRule(rule, context)
  │   ├─ role rule  → matchesRoleRule(rule, context)
  │   ├─ segment rule → matchesSegmentRule(rule, context)
  │   │   └─ evaluateSegment(conditions, context)
  │   │       ├─ Legacy format → conditionType='custom', wrap in array
  │   │       └─ New format → iterate conditions.conditions[]
  │   │           ├─ user type → matchesUserRule()
  │   │           ├─ role type → matchesRoleRule()
  │   │           └─ custom type → matchClause(condition, context)
  │   │               ├─ AND logic (default): all must match
  │   │               └─ OR logic: first match wins
  │   ├─ custom rule → matchesCustomRule(rule, context)
  │   │   └─ For each condition in rule.conditions:
  │   │       └─ matchClause(condition, context)
  │   │           ├─ Resolve clauseValue (between → values, else → value)
  │   │           ├─ Resolve valueToTest from context[contextKey]
  │   │           ├─ Type normalize (string/semver → trim, number → Number, boolean → === 'true')
  │   │           ├─ Normalize operator (greater_than → gt, in → is_one_of, etc.)
  │   │           └─ Switch on type → switch on operator → return boolean
  │   └─ percentage rule → (handled separately, not covered in this audit)
  │
  └─ 4. Return first matched rule's variation, or default variation
```

---

## 12. Frontend ↔ Backend Consistency Check

| Frontend Type | Frontend Operators | Backend Handler | Gap? |
|---------------|--------------------|-----------------|------|
| `string`      | 7 operators        | All 7 + aliases | ✅ None |
| `number`      | 9 operators        | All 9 + aliases | ✅ None |
| `boolean`     | 2 operators        | Both            | ✅ None |
| `object`      | 3 operators        | All 3           | ✅ None |
| `array`       | 6 operators        | All 6           | ✅ None |
| `semver`      | 9 operators        | All 9 + aliases | ✅ None |
| `date`        | 3 operators        | All 3 + aliases | ✅ None |

**Result: No gaps found.** Every frontend operator has a corresponding backend handler. Backend has additional aliases for backward compatibility that are not exposed in the frontend UI.

---

## 13. Known Edge Cases

1. **Semver lexicographic comparison**: `"1.9.0" > "1.10.0"` returns `true` because `"9" > "1"` lexicographically. Use a semver library for strict version comparison.

2. **Date NaN handling**: Invalid date strings produce `new Date("invalid")` → `NaN`. All comparisons with `NaN` return `false`, so invalid dates never match.

3. **Empty string context values**: An empty string `""` passed as `context.userId` will match `is_one_of` with an array containing `""`. The `!valueToTest` guard in `matchesUserRule` and `matchesRoleRule` prevents this (returns `isMatched: false` for falsy context values).

4. **Between operator value resolution**: The backend prefers `clause.values` when `operator === 'between'` and `Array.isArray(clause.values)`. If `values` is missing, falls back to `clause.value` (which may be a string, not an array). The frontend sends `values` as an array, so this path is taken in practice.

5. **Object deep comparison via JSON.stringify**: `equals_json` uses `JSON.stringify` for comparison. This means `{ a: 1, b: 2 }` and `{ b: 2, a: 1 }` produce different JSON strings and will not match. Key order matters.

6. **Array `contains` vs `contains_all`**: `contains` checks if the array has the exact value. `contains_all` checks if the array has all values from the clause. For a single value, they are equivalent.

7. **Regex operator**: `matches_regex` uses `new RegExp(clauseValue)`. Malformed regex patterns will throw. The backend catches this via `catch (e)` and returns `{ isMatched: false }`.
