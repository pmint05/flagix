# API Contracts: Feature Flag SDKs (Core & React)

This document defines the public API surface for the `sdk-core` and `sdk-react` packages.

## `sdk-core` Public API

### `FlagixClient` Class

```typescript
class FlagixClient {
  constructor(config: FlagixConfig);

  /**
   * Initializes the SDK, performs the initial eager fetch, 
   * and establishes the SSE connection.
   */
  async init(context: EvaluationContext): Promise<void>;

  /**
   * Updates the evaluation context. Triggers cache clear 
   * and immediate re-fetch of all flags.
   */
  async setContext(context: EvaluationContext): Promise<void>;

  /**
   * Retrieves a flag value from cache. 
   * Returns defaultValue if flag is not found or SDK is in error state.
   */
  getFlagValue<T>(key: string, defaultValue: T): T;

  /**
   * Retrieves full evaluation details for a flag.
   */
  getFlag(key: string): EvaluationResult | null;

  /**
   * Retrieves all currently evaluated flags.
   */
  getAllFlags(): Record<string, EvaluationResult>;

  /**
   * Subscribe to cache updates (used by React wrapper).
   */
  subscribe(callback: (flags: Record<string, EvaluationResult>) => void): () => void;
}
```

## `sdk-react` Public API

### `FlagixProvider` Component

```typescript
interface FlagixProviderProps {
  client: FlagixClient;
  children: React.ReactNode;
  initialContext?: EvaluationContext;
}

const FlagixProvider: React.FC<FlagixProviderProps>;

/**
 * For unit/component testing.
 */
interface MockFlagixProviderProps {
  flags: Record<string, EvaluationResult>;
  children: React.ReactNode;
}

const MockFlagixProvider: React.FC<MockFlagixProviderProps>;
```

### Hooks

```typescript
/**
 * Evaluates a single flag.
 */
function useFlag<T>(key: string, defaultValue: T): {
  value: T;
  isLoading: boolean;
  error: Error | null;
};

/**
 * Retrieves all evaluated flags.
 */
function useFlags(): Record<string, EvaluationResult>;

/**
 * Provides access to the raw FlagixClient instance.
 */
function useFlagix(): FlagixClient;
```
