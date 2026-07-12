'use client';

import {
  MutationCache,
  QueryCache,
  QueryClientProvider as ReactQueryClientProvider,
} from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { SessionExpiredError } from '@/lib/api';
import { makeQueryClient } from '@/lib/queryClient';

export function QueryClientProvider({ children }: { children: ReactNode }) {
  const { logout } = useAuth();
  const [client] = useState(() => {
    let qc: ReturnType<typeof makeQueryClient>;
    const onSessionExpired = (error: unknown) => {
      if (error instanceof SessionExpiredError) {
        void logout();
        qc.clear();
      }
    };
    qc = makeQueryClient({
      queryCache: new QueryCache({ onError: onSessionExpired }),
      mutationCache: new MutationCache({ onError: onSessionExpired }),
    });
    return qc;
  });

  return (
    <ReactQueryClientProvider client={client}>
      {children}
    </ReactQueryClientProvider>
  );
}
