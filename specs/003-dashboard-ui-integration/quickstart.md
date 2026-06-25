# Quickstart & Validation

This guide outlines how to validate the dashboard UI functionality once implemented.

## Prerequisites
- Backend API running locally on `http://localhost:3000` (or configured API port)
- Frontend development server running

## Setup
1. Start the frontend:
   ```bash
   pnpm --filter frontend dev
   ```
2. Navigate to `http://localhost:5173`

## Validation Scenarios

### 1. Authentication
1. Go to the login page.
2. Click "Sign up" and create an account.
3. Verify automatic redirection to the dashboard.
4. Verify user name appears in the header.

### 2. Project & Environment Setup
1. From the dashboard, click "Create Project".
2. Enter "E-commerce App" and save.
3. Select the project, go to Environments, and verify Development, Staging, and Production exist by default.

### 3. Feature Flag Creation
1. Go to the Flags page for the Development environment.
2. Click "Create Flag".
3. Enter Key: `new-checkout`, Name: `New Checkout Flow`, Type: `Boolean`.
4. Save the flag. Verify it appears in the list with a "Draft" badge.

### 4. Flag Activation & Toggling
1. Click the flag to view details.
2. Click "Activate". Verify the status changes to Active.
3. Use the toggle switch in the list view to turn the flag ON. Verify immediate UI feedback.

### 5. SDK Key Generation
1. Go to the SDK Keys section for the Development environment.
2. Click "Generate Key".
3. Verify the raw key is displayed once, and upon refresh, only the masked key is visible.
