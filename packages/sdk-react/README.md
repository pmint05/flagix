# Flagix React SDK

Idiomatic React integration for the Flagix platform using hooks and optimized re-renders.

## Installation

```bash
pnpm add @flagix/sdk-react @flagix/sdk-core
```

## Usage

### 1. Wrap your app with `FlagixProvider`

```tsx
import { FlagixProvider, FlagixClient } from '@flagix/sdk-react';

const client = new FlagixClient({ sdkKey: 'your-sdk-key' });

function App() {
  return (
    <FlagixProvider 
      client={client} 
      initialContext={{ userId: 'user-123' }}
    >
      <MyComponent />
    </FlagixProvider>
  );
}
```

### 2. Use the `useFlag` hook

```tsx
import { useFlag } from '@flagix/sdk-react';

function MyComponent() {
  const { value: isNewLayout, isLoading } = useFlag('new-layout', false);

  if (isLoading) return <div>Loading...</div>;

  return isNewLayout ? <NewLayout /> : <OldLayout />;
}
```

### 3. Access the raw client or all flags

```tsx
import { useFlagix, useFlags } from '@flagix/sdk-react';

function AdvancedComponent() {
  const client = useFlagix();
  const allFlags = useFlags();

  const handleUpdate = () => {
    client.setContext({ userId: 'user-456' });
  };

  return <button onClick={handleUpdate}>Change User</button>;
}
```

## Features

- **Optimized**: Uses `useSyncExternalStore` for precise re-renders only when relevant flags change.
- **Reactive**: Automatically re-renders when flags are updated via SSE.
- **Fail-Safe**: Guarantees zero propagation of evaluation errors to your UI.
