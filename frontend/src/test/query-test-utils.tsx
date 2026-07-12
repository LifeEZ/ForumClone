import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, renderHook, type RenderOptions } from '@testing-library/react';
import { type ReactElement, type ReactNode } from 'react';

export { renderHook };

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

export function withQueryClient(ui: ReactNode): ReactElement {
  const client = createTestQueryClient();
  return <QueryClientProvider client={client}>{ui}</QueryClientProvider>;
}

export function renderWithQueryClient(
  ui: ReactElement,
  options?: RenderOptions,
) {
  const client = createTestQueryClient();
  return render(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
    ...options,
  });
}

export function renderHookWithQueryClient<T>(hook: () => T) {
  const client = createTestQueryClient();
  return {
    client,
    ...renderHook(hook, {
      wrapper: ({ children }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    }),
  };
}

export { createTestQueryClient as makeQueryClient };
