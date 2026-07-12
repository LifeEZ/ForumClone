import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { ApiError, SessionExpiredError } from '@/lib/api';

const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 500;
const MAX_BACKOFF_MS = 30_000;

export function isTransientQueryError(error: unknown): boolean {
  if (error instanceof SessionExpiredError) return false;
  if (error instanceof ApiError) {
    return error.status === 429 || error.status >= 500;
  }
  // Non-ApiError (e.g. network failure) is treated as transient.
  return true;
}

export interface MakeQueryClientOptions {
  queryCache?: QueryCache;
  mutationCache?: MutationCache;
}

export function makeQueryClient(
  options: MakeQueryClientOptions = {},
): QueryClient {
  return new QueryClient({
    queryCache: options.queryCache,
    mutationCache: options.mutationCache,
    defaultOptions: {
      queries: {
        retry: (failureCount, error) =>
          failureCount < MAX_RETRIES && isTransientQueryError(error),
        retryDelay: (failureCount) =>
          Math.min(BASE_BACKOFF_MS * 2 ** failureCount, MAX_BACKOFF_MS),
        staleTime: 0,
        refetchOnWindowFocus: true,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
