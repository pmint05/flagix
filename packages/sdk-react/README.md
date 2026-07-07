# Flagix React SDK

React integration for the Flagix platform. Provides hooks and a provider component with optimized re-renders and TypeScript support.

## Installation

```bash
pnpm add @flagix/sdk-react @flagix/sdk-core
```

## Quick Start

### 1. Create a client and wrap your app

```tsx
import { FlagixClient } from '@flagix/sdk-core';
import { FlagixProvider } from '@flagix/sdk-react';

const client = new FlagixClient({
  sdkKey: 'sdk_client_xxxxx',
  persistent: true,
  ttl: 30000,
});

function App() {
  return (
    <FlagixProvider client={client} initialContext={{ userId: 'user-123' }}>
      <Router />
    </FlagixProvider>
  );
}
```

`FlagixProvider` calls `client.init()` automatically on mount and manages the loading state. Your components can safely call `useFlag` at any point — the SDK returns the fallback value until initialization completes.

### 2. Use the `useFlag` hook

```tsx
import { useFlag } from '@flagix/sdk-react';

function NewLayout() { /* ... */ }
function OldLayout() { /* ... */ }

function HomePage() {
  const { value: isNewLayout, isLoading } = useFlag('new-layout', false);

  if (isLoading) return <Skeleton />;
  return isNewLayout ? <NewLayout /> : <OldLayout />;
}
```

The hook subscribes to a single flag. When that flag changes via SSE, only the component that calls `useFlag` for it re-renders. Other components using different flags are unaffected.

### 3. Check SDK readiness

```tsx
import { useFlagixReady, useFlag } from '@flagix/sdk-react';

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const isReady = useFlagixReady();
  const { value: isDark } = useFlag('dark-mode', false);

  if (!isReady) return <LoadingScreen />;

  return (
    <div className={isDark ? 'dark' : 'light'}>
      {children}
    </div>
  );
}
```

### 4. Access all flags

```tsx
import { useFlags } from '@flagix/sdk-react';

function DebugPanel() {
  const allFlags = useFlags();

  return (
    <pre>{JSON.stringify(allFlags, null, 2)}</pre>
  );
}
```

`useFlags` returns the full snapshot of evaluated flags. This hook re-renders whenever any flag changes — use sparingly, prefer `useFlag` for production components.

### 5. Access the raw client

```tsx
import { useFlagix } from '@flagix/sdk-react';

function UserSwitcher() {
  const client = useFlagix();

  return (
    <button onClick={() => client.setContext({ userId: 'user-789' })}>
      Switch User
    </button>
  );
}
```

## API Reference

### Components

| Component | Props | Description |
|---|---|---|
| `FlagixProvider` | `client: FlagixClient`, `initialContext?: EvaluationContext` | Initializes the SDK and provides it to the component tree. |
| `MockFlagixProvider` | `initialFlags?: Record<string, EvaluationResult>`, `isReady?: boolean` | Testing provider. See [Testing](#testing) below. |

### Hooks

| Hook | Returns | Re-renders when |
|---|---|---|
| `useFlag(key, default)` | `{ value: T, isLoading: boolean, error: Error \| null }` | The specified flag changes |
| `useFlags()` | `Record<string, EvaluationResult>` | Any flag changes |
| `useFlagix()` | `FlagixClient` | Never (static reference) |
| `useFlagixReady()` | `boolean` | SDK readiness changes |
| `useMockFlagixClient()` | `MockFlagixClient` | Never (static reference, test-only) |

## Type-Safe Flag Keys

Define a flag map to get autocomplete and compile-time errors for invalid keys:

```tsx
import { useFlag } from '@flagix/sdk-react';

interface MyFlags {
  'dark-mode': boolean;
  'theme-color': 'blue' | 'rose' | 'dark-slate';
  'max-items': number;
}

function useTypedFlag<K extends keyof MyFlags>(key: K, fallback: MyFlags[K]) {
  return useFlag<MyFlags[K]>(key, fallback);
}

// TypeScript enforces correct keys and value types
const { value: isDark } = useTypedFlag('dark-mode', false);
const { value: accent } = useTypedFlag('theme-color', 'blue');
const { value: max } = useTypedFlag('max-items', 10);
// useTypedFlag('typo-here', false);  // Compile error
// useTypedFlag('dark-mode', 'blue'); // Compile error: string is not boolean
```

## Testing

Flagix provides a mock provider for unit tests so you can assert on flag-driven UI without connecting to a real backend:

```tsx
import { render, screen } from '@testing-library/react';
import { MockFlagixProvider, useMockFlagixClient } from '@flagix/sdk-react';

function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <MockFlagixProvider
      initialFlags={{
        'dark-mode': {
          flagKey: 'dark-mode',
          enabled: true,
          resolvedValue: true,
          variationKey: 'true',
          evaluationReason: 'DEFAULT',
        },
      }}
      isReady={true}
    >
      {children}
    </MockFlagixProvider>
  );
}

it('renders dark theme when flag is on', () => {
  render(<MyComponent />, { wrapper: TestWrapper });
  expect(screen.getByTestId('theme')).toHaveClass('dark');
});

it('reacts to flag changes at runtime', () => {
  function Toggler() {
    const mock = useMockFlagixClient();
    return <button onClick={() => mock.setFlag('dark-mode', { ...mock.getFlag('dark-mode')!, resolvedValue: false })}>Toggle</button>;
  }

  render(
    <TestWrapper>
      <MyComponent />
      <Toggler />
    </TestWrapper>
  );

  fireEvent.click(screen.getByText('Toggle'));
  expect(screen.getByTestId('theme')).toHaveClass('light');
});
```

## How It Works

`FlagixProvider` calls `client.init(initialContext)` on mount. This triggers the SDK to load cached flags from localStorage (if `persistent: true`), open an SSE connection to the backend, and fetch the latest flag evaluations. While initialization is in progress, `useFlag` returns the provided fallback value and `isLoading = true`.

Once the SDK is ready, `useFlagixReady()` returns `true` and all `useFlag` hooks return resolved values. When an admin changes a flag in the dashboard, the backend emits an SSE event. The SDK receives it, re-fetches the affected flag, and React re-renders only the components subscribed to that flag. This is implemented with `useSyncExternalStore` — a React 18 hook that avoids unnecessary re-renders by comparing snapshots.

If the SSE connection drops, the SDK reconnects with exponential backoff and random jitter. During reconnection, `getFlagValue()` continues to serve the last known values from the in-memory cache.
