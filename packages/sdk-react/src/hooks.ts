import { useContext, useSyncExternalStore } from 'react';
import { FlagixContext } from './provider';
import { FlagixClient, EvaluationResult } from '@flagix/sdk-core';

/**
 * Provides direct access to the FlagixClient instance.
 */
export function useFlagix(): FlagixClient {
  const client = useContext(FlagixContext);
  if (!client) {
    throw new Error('useFlagix must be used within a FlagixProvider');
  }
  return client;
}

/**
 * Returns all currently evaluated flags and subscribes to updates.
 */
export function useFlags(): Record<string, EvaluationResult> {
  const client = useFlagix();

  return useSyncExternalStore(
    (callback) => client.subscribe(callback),
    () => client.getAllFlags(),
    () => ({}) // SSR snapshot
  );
}

/**
 * Evaluates a single flag and subscribes to updates.
 */
export function useFlag<T>(key: string, defaultValue: T): {
  value: T;
  isLoading: boolean;
  error: Error | null;
} {
  const flags = useFlags();
  
  const flag = flags[key];
  return {
    value: flag ? (flag.resolvedValue as T) : defaultValue,
    isLoading: false,
    error: null,
  };
}
