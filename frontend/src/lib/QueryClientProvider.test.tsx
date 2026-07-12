import { useQuery } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { ApiError, SessionExpiredError } from '@/lib/api';

const hoisted = vi.hoisted(() => {
  let loggedOut = false;
  return {
    logoutSpy: vi.fn(() => {
      loggedOut = true;
    }),
    isLoggedOut: () => loggedOut,
    reset: () => {
      loggedOut = false;
    },
  };
});

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    logout: hoisted.logoutSpy,
    user: null,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
  }),
}));

import { QueryClientProvider } from '@/lib/QueryClientProvider';

afterEach(() => {
  hoisted.logoutSpy.mockClear();
  hoisted.reset();
});

function ThrowingQuery({ error }: { error: Error }) {
  useQuery({
    queryKey: ['test-throw'],
    queryFn: async () => {
      throw error;
    },
    retry: false,
    enabled: !hoisted.isLoggedOut(),
  });
  return null;
}

describe('QueryClientProvider', () => {
  it('logs out and clears the cache on SessionExpiredError', async () => {
    render(
      <QueryClientProvider>
        <ThrowingQuery error={new SessionExpiredError()} />
      </QueryClientProvider>,
    );
    await waitFor(() => expect(hoisted.logoutSpy).toHaveBeenCalledTimes(1));
  });

  it('does not log out on a non-terminal ApiError', async () => {
    render(
      <QueryClientProvider>
        <ThrowingQuery error={new ApiError(500, 'boom')} />
      </QueryClientProvider>,
    );
    await waitFor(() => expect(hoisted.logoutSpy).not.toHaveBeenCalled());
  });
});
