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

### 4. Type-safe flag keys with TypeScript

Create typed wrappers to get autocomplete and compile-time safety for your flag keys:

```tsx
import { useFlag } from '@flagix/sdk-react';

// Define your flag types
interface FlagMap {
  'new-layout': boolean;
  'checkout-version': 'v1' | 'v2' | 'v3';
  'max-items': number;
  'feature-gating': Record<string, boolean>;
}

// Type-safe wrapper
function useTypedFlag<K extends keyof FlagMap>(
  key: K,
  defaultValue: FlagMap[K]
): { value: FlagMap[K]; isLoading: boolean; error: Error | null } {
  return useFlag<FlagMap[K]>(key, defaultValue);
}

// Usage with autocomplete
function MyComponent() {
  const { value: isNewLayout, isLoading } = useTypedFlag('new-layout', false);
  const { value: version } = useTypedFlag('checkout-version', 'v1');
  const { value: maxItems } = useTypedFlag('max-items', 10);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {isNewLayout && <NewLayout />}
      <p>Version: {version}</p>
      <p>Max items: {maxItems}</p>
    </div>
  );
}
```

This pattern provides:
- **Autocomplete**: Your IDE will suggest valid flag keys
- **Type Safety**: TypeScript will error if you pass an invalid key or wrong default value
- **Refactoring**: Renaming a flag key will update all usages automatically

## Features

- **Optimized**: Uses `useSyncExternalStore` for precise re-renders only when relevant flags change.
- **Reactive**: Automatically re-renders when flags are updated via SSE.
- **Fail-Safe**: Guarantees zero propagation of evaluation errors to your UI.
- **Type-Safe**: Supports TypeScript generics for compile-time flag key validation.
