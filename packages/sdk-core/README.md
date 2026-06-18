# Flagix Core SDK

The universal feature flag SDK for the Flagix platform. Supports Browser and Node.js (18+) environments.

## Installation

```bash
pnpm add @flagix/sdk-core
```

## Usage

```typescript
import { FlagixClient } from '@flagix/sdk-core';

const client = new FlagixClient({
  sdkKey: 'your-sdk-key',
  baseUrl: 'https://api.flagix.com/api/v1',
  persistent: true, // Enable LocalStorage persistence in Browser
});

// Initialize with user context
await client.init({ 
  userId: 'user-123',
  role: 'admin'
});

// Retrieve a flag value with a safe default
const isNewLayout = client.getFlagValue('new-layout', false);

if (isNewLayout) {
  console.log('Rendering new layout...');
}

// Subscribe to real-time updates
const unsubscribe = client.subscribe((flags) => {
  console.log('Flags updated:', flags);
});

// Update context (e.g., on login/logout)
await client.setContext({ userId: 'user-456' });

// Close the SDK to stop real-time sync
client.close();
```

## Resiliency

- **Fail-Safe**: Returns safe default values if the backend is unreachable or in case of evaluation errors.
- **Real-time**: Receives updates via SSE with automatic exponential backoff and jitter for reconnections.
- **Persistent**: Optionally caches flags in LocalStorage to survive page reloads.
