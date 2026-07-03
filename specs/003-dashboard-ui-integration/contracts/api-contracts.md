# API Contracts

The frontend dashboard expects the following API contracts from the backend. The backend currently implements a **Deep Nested RESTful** architecture where the `organizationId` (and often `projectId`) is strictly required in the URL path to enforce RBAC and context explicitly.

*Note: All paths below are prefixed with `/api` when called from the frontend via the `ky` client.*

## Authentication
- **POST** `/auth/sign-in` - Login (Better Auth)
- **POST** `/auth/sign-up` - Register
- **POST** `/auth/sign-out` - Logout
- **GET** `/auth/session` - Get current session

## Projects
- **GET** `/organizations/:organizationId/projects` - List projects
- **POST** `/organizations/:organizationId/projects` - Create project
- **GET** `/organizations/:organizationId/projects/:projectId` - Get project details
- **PATCH** `/organizations/:organizationId/projects/:projectId` - Update project
- **DELETE** `/organizations/:organizationId/projects/:projectId` - Delete project

## Environments
- **GET** `/organizations/:organizationId/projects/:projectId/environments` - List environments
- **POST** `/organizations/:organizationId/projects/:projectId/environments` - Create environment
- **GET** `/organizations/:organizationId/projects/:projectId/environments/:envId` - Get environment details
- **PATCH** `/organizations/:organizationId/projects/:projectId/environments/:envId` - Update environment
- **DELETE** `/organizations/:organizationId/projects/:projectId/environments/:envId` - Delete environment

## Feature Flags
*Warning: The current backend architecture scopes feature flags to the `envId` instead of `projectId`. This is a known architectural flaw being tracked.*
- **GET** `/organizations/:organizationId/projects/:projectId/environments/:envId/flags` - List flags for an environment
- **POST** `/organizations/:organizationId/projects/:projectId/environments/:envId/flags` - Create flag
- **GET** `/organizations/:organizationId/flags/:flagId` - Get flag details
- **PATCH** `/organizations/:organizationId/flags/:flagId` - Update flag
- **DELETE** `/organizations/:organizationId/flags/:flagId` - Delete flag

## Targeting Rules & Variations
- **GET** `/organizations/:organizationId/flags/:flagId/rules` - List targeting rules
- **POST** `/organizations/:organizationId/flags/:flagId/rules` - Create rule
- **GET** `/organizations/:organizationId/flags/:flagId/rules/:ruleId` - Get rule details
- **PATCH** `/organizations/:organizationId/flags/:flagId/rules/:ruleId` - Update rule
- **DELETE** `/organizations/:organizationId/flags/:flagId/rules/:ruleId` - Delete rule

## SDK Keys
- **GET** `/organizations/:organizationId/environments/:envId/sdk-keys` - List SDK keys
- **POST** `/organizations/:organizationId/environments/:envId/sdk-keys` - Create new SDK key
- **DELETE** `/organizations/:organizationId/environments/:envId/sdk-keys/:keyId` - Revoke SDK key

## Audit Logs
- **GET** `/organizations/:organizationId/audit-logs` - List audit logs (supports query params: `projectId`, `environmentId`, `entityType`, `actionType`, `limit`, `offset`, `from`, `to`)
- **GET** `/organizations/:organizationId/audit-logs/:logId` - Get specific audit log entry
