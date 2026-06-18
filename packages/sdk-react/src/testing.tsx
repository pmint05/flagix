import React, { createContext, useState, useCallback, useContext } from 'react';
import { FlagixContext, FlagixProviderStateContext } from './provider';
import { EvaluationResult, EvaluationContext } from '@flagix/sdk-core';

interface MockFlagixClient {
  getFlagValue: <T>(key: string, defaultValue: T) => T;
  getFlag: (key: string) => EvaluationResult | null;
  getAllFlags: () => Record<string, EvaluationResult>;
  setFlag: (key: string, result: EvaluationResult) => void;
  getIsReady: () => boolean;
  setReady: (ready: boolean) => void;
  subscribe: (callback: () => void) => () => void;
  onReady: (callback: (ready: boolean) => void) => () => void;
  init: (context: EvaluationContext) => Promise<void>;
  setContext: (context: EvaluationContext) => Promise<void>;
  close: () => void;
}

function createMockClient(initialFlags?: Record<string, EvaluationResult>): MockFlagixClient {
  let flags: Record<string, EvaluationResult> = initialFlags || {};
  let isReady = !!initialFlags;
  const subscribers = new Set<() => void>();
  const readinessSubscribers = new Set<(ready: boolean) => void>();

  const notifySubscribers = () => {
    subscribers.forEach((cb) => cb());
  };

  const notifyReadiness = (ready: boolean) => {
    readinessSubscribers.forEach((cb) => cb(ready));
  };

  return {
    getFlagValue: <T,>(key: string, defaultValue: T): T => {
      const flag = flags[key];
      return flag ? (flag.resolvedValue as T) : defaultValue;
    },
    getFlag: (key: string) => flags[key] || null,
    getAllFlags: () => flags,
    setFlag: (key: string, result: EvaluationResult) => {
      flags[key] = result;
      notifySubscribers();
    },
    getIsReady: () => isReady,
    setReady: (ready: boolean) => {
      isReady = ready;
      notifyReadiness(ready);
      notifySubscribers();
    },
    subscribe: (callback: () => void) => {
      subscribers.add(callback);
      return () => subscribers.delete(callback);
    },
    onReady: (callback: (ready: boolean) => void) => {
      readinessSubscribers.add(callback);
      if (isReady) callback(true);
      return () => readinessSubscribers.delete(callback);
    },
    init: async () => {
      isReady = true;
      notifyReadiness(true);
      notifySubscribers();
    },
    setContext: async () => {},
    close: () => {
      subscribers.clear();
      readinessSubscribers.clear();
    },
  };
}

interface MockFlagixProviderProps {
  children: React.ReactNode;
  initialFlags?: Record<string, EvaluationResult>;
  isReady?: boolean;
}

const MockFlagixClientContext = createContext<MockFlagixClient | null>(null);

export const MockFlagixProvider: React.FC<MockFlagixProviderProps> = ({
  children,
  initialFlags,
  isReady: initialIsReady = false,
}) => {
  const [client] = useState(() => createMockClient(initialFlags));
  const [ready, setReady] = useState(initialIsReady || !!initialFlags);

  const handleSetReady = useCallback((newReady: boolean) => {
    setReady(newReady);
    client.setReady(newReady);
  }, [client]);

  return (
    <MockFlagixClientContext.Provider value={client}>
      <FlagixContext.Provider value={client as any}>
        <FlagixProviderStateContext.Provider value={{ isInitializing: !ready }}>
          {children}
        </FlagixProviderStateContext.Provider>
      </FlagixContext.Provider>
    </MockFlagixClientContext.Provider>
  );
};

export function useMockFlagixClient(): MockFlagixClient {
  const client = useContext(MockFlagixClientContext);
  if (!client) {
    throw new Error('useMockFlagixClient must be used within a MockFlagixProvider');
  }
  return client;
}

export type { MockFlagixClient };
