import React, { createContext, useEffect, useState } from 'react';
import { FlagixClient, EvaluationContext } from '@flagix/sdk-core';

export const FlagixContext = createContext<FlagixClient | null>(null);

export interface FlagixProviderState {
  isInitializing: boolean;
}

export const FlagixProviderStateContext = createContext<FlagixProviderState>({
  isInitializing: false,
});

interface FlagixProviderProps {
  client: FlagixClient;
  children: React.ReactNode;
  initialContext?: EvaluationContext;
}

export const FlagixProvider: React.FC<FlagixProviderProps> = ({
  client,
  children,
  initialContext,
}) => {
  const [isInitializing, setIsInitializing] = useState(() => {
    return initialContext ? !client.getIsReady() : false;
  });

  useEffect(() => {
    if (!initialContext) return;

    const unsubscribe = client.onReady((ready) => {
      if (ready) setIsInitializing(false);
    });

    client.init(initialContext).catch(() => {});

    return unsubscribe;
  }, [client, initialContext]);

  return (
    <FlagixContext.Provider value={client}>
      <FlagixProviderStateContext.Provider value={{ isInitializing }}>
        {children}
      </FlagixProviderStateContext.Provider>
    </FlagixContext.Provider>
  );
};
