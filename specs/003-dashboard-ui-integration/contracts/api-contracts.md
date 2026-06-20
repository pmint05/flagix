# API Contracts

The frontend dashboard expects the following API contracts from the backend. The actual Zod schemas should be shared via the `@flagix/shared` package.

## Authentication
- **POST** `/api/auth/sign-in` - Login (Better Auth)
- **POST** `/api/auth/sign-up` - Register
- **POST** `/api/auth/sign-out` - Logout
- **GET** `/api/auth/session` - Get current session

## Projects
- **GET** `/api/projects` - List projects (Paginated)
- **POST** `/api/projects` - Create project
- **PUT** `/api/projects/:id` - Update project
- **DELETE** `/api/projects/:id` - Delete project

## Environments
- **GET** `/api/projects/:id/environments` - List environments
- **POST** `/api/projects/:id/environments` - Create environment
- **PUT** `/api/environments/:id` - Update environment
- **POST** `/api/environments/:id/deactivate` - Soft delete
- **POST** `/api/environments/:id/restore` - Restore

## Feature Flags
- **GET** `/api/projects/:id/flags` - List flags (Paginated, support search/filter)
- **POST** `/api/projects/:id/flags` - Create flag
- **GET** `/api/flags/:id` - Get flag details
- **PUT** `/api/flags/:id` - Update flag
- **POST** `/api/flags/:id/status` - Update status (Activate/Archive/Restore)

## Rules & Variations
- **GET** `/api/flags/:id/environments/:envId/rules` - Get targeting rules
- **PUT** `/api/flags/:id/environments/:envId/rules` - Update/Reorder rules

## SDK Keys
- **GET** `/api/environments/:id/keys` - List SDK keys
- **POST** `/api/environments/:id/keys` - Generate new key
- **POST** `/api/keys/:id/revoke` - Revoke key

## Audit Logs
- **GET** `/api/audit-logs` - List audit logs (Paginated, filtered)
