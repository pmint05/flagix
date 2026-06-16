import React, { createContext, useEffect, useState } from 'react';
import { FlagixClient, EvaluationContext } from '@flagix/sdk-core';

export const FlagixContext = createContext<FlagixClient | null>(null);

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
  const [isInitializing, setIsInitializing] = useState(!!initialContext);

  useEffect(() => {
    let mounted = true;
    if (initialContext) {
      client.init(initialContext).finally(() => {
        if (mounted) setIsInitializing(false);
      });
    }
    return () => {
      mounted = false;
    };
  }, [client, initialContext]);

  return (
    <FlagixContext.Provider value={client}>
      {children}
    </FlagixContext.Provider>
  );
};
