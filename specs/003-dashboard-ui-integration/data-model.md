# Data Model

Extracted entities for the Dashboard UI:

## User
- Fields: `id`, `email`, `name`, `role`
- Relationships: Belongs to Organization(s)

## Organization
- Fields: `id`, `name`
- Relationships: Contains Projects and Users

## Project
- Fields: `id`, `organizationId`, `name`, `description`, `flagCount`
- Relationships: Contains Environments and Flags

## Environment
- Fields: `id`, `projectId`, `name`, `type` (Development/Staging/Production/Custom), `isActive`
- Relationships: Scopes SDK Keys and Flag States
- Notes: Supports soft-delete (`isActive: false`).

## Feature Flag
- Fields: `id`, `projectId`, `key`, `name`, `description`, `type` (Boolean/Multivariate), `status` (Draft/Active/Archived)
- Relationships: Contains Variations and Targeting Rules
- Rules: Key must be unique per project. Type is immutable after creation. Archived flags can be restored to Draft.

## Variation
- Fields: `id`, `flagId`, `name`, `value`
- Rules: Maximum 10 variations per flag.

## Targeting Rule
- Fields: `id`, `flagId`, `environmentId`, `type` (KillSwitch/User/Role/Percentage), `priority`, `conditions`, `variationId`
- Rules: Evaluated in strict order (Kill Switch > User > Role > Percentage > Default). Percentage rollouts must sum to exactly 100%.

## SDK Key
- Fields: `id`, `environmentId`, `name`, `maskedKey`, `isActive`, `createdAt`
- Rules: Maximum 5 active keys per environment. Scoped to environment.

## Audit Log
- Fields: `id`, `actorId`, `actorName`, `timestamp`, `action`, `entityType`, `entityId`, `changes`
- Rules: Read-only chronological log.
