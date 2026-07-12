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
    const onSessionExpired = (error: unknown) => {
      if (error instanceof SessionExpiredError) {
        void logout();
        qc.clear();
      }
    };
    const queryCache = new QueryCache({ onError: onSessionExpired });
    const mutationCache = new MutationCache({ onError: onSessionExpired });
    const qc = makeQueryClient({ queryCache, mutationCache });
    return qc;
  });

  return (
    <ReactQueryClientProvider client={client}>
      {children}
    </ReactQueryClientProvider>
  );
}
