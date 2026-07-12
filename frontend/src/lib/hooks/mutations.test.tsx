import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { server } from '@/test/server';
import { renderHookWithQueryClient } from '@/test/query-test-utils';
import { TokenService } from '@/lib/tokenService';
import { useVote } from '@/lib/hooks/useVote';
import {
  useJoinCommunity,
  useLeaveCommunity,
} from '@/lib/hooks/useCommunityMembership';
import { useLogin, useLogout, useRegister } from '@/lib/hooks/useAuthMutations';

const BASE = 'http://localhost:8000';

afterEach(() => {
  TokenService.clear();
  server.resetHandlers();
});

describe('useVote', () => {
  beforeEach(() => {
    TokenService.set({
      access_token: 'a',
      refresh_token: 'r',
      token_type: 'bearer',
    });
  });

  it('casts a post vote and invalidates the post + home', async () => {
    let voteBody: unknown;
    server.use(
      http.post(`${BASE}/api/v1/votes`, async ({ request }) => {
        voteBody = await request.json();
        return HttpResponse.json({
          target_type: 'post',
          target_id: 'p1',
          value: 1,
        });
      }),
    );
    const { result, client } = renderHookWithQueryClient(() => useVote());
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries');

    await result.current.mutateAsync({
      target_type: 'post',
      target_id: 'p1',
      value: 1,
    });

    expect(voteBody).toEqual({
      target_type: 'post',
      target_id: 'p1',
      value: 1,
    });
    const keys = invalidateSpy.mock.calls.map((c) => c[0]?.queryKey);
    expect(keys).toContainEqual(['post', 'p1']);
    expect(keys).toContainEqual(['home']);
  });

  it('does not touch the post cache for a comment vote', async () => {
    server.use(
      http.post(`${BASE}/api/v1/votes`, () =>
        HttpResponse.json({
          target_type: 'comment',
          target_id: 'cm1',
          value: 1,
        }),
      ),
    );
    const { result, client } = renderHookWithQueryClient(() => useVote());
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries');
    await result.current.mutateAsync({
      target_type: 'comment',
      target_id: 'cm1',
      value: 1,
    });
    const keys = invalidateSpy.mock.calls.map((c) => c[0]?.queryKey);
    expect(keys).not.toContainEqual(['post', 'cm1']);
  });
});

describe('useCommunityMembership', () => {
  beforeEach(() => {
    TokenService.set({
      access_token: 'a',
      refresh_token: 'r',
      token_type: 'bearer',
    });
  });

  it('join calls POST /join and invalidates community/communities/home', async () => {
    let method: string;
    server.use(
      http.post(`${BASE}/api/v1/communities/films/join`, () => {
        method = 'POST';
        return HttpResponse.json({});
      }),
    );
    const { result, client } = renderHookWithQueryClient(() =>
      useJoinCommunity(),
    );
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries');
    await result.current.mutateAsync('films');
    expect(method!).toBe('POST');
    const keys = invalidateSpy.mock.calls.map((c) => c[0]?.queryKey);
    expect(keys).toContainEqual(['community', 'films']);
    expect(keys).toContainEqual(['communities']);
    expect(keys).toContainEqual(['home']);
  });

  it('leave calls DELETE /join and invalidates the same keys', async () => {
    let method: string;
    server.use(
      http.delete(`${BASE}/api/v1/communities/films/join`, () => {
        method = 'DELETE';
        return HttpResponse.json({});
      }),
    );
    const { result, client } = renderHookWithQueryClient(() =>
      useLeaveCommunity(),
    );
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries');
    await result.current.mutateAsync('films');
    expect(method!).toBe('DELETE');
    expect(invalidateSpy.mock.calls.length).toBeGreaterThan(0);
  });
});

describe('useAuthMutations', () => {
  it('useLogin stores tokens and invalidates me', async () => {
    server.use(
      http.post(`${BASE}/api/v1/auth/login`, () =>
        HttpResponse.json({
          access_token: 'a',
          refresh_token: 'r',
          token_type: 'bearer',
        }),
      ),
    );
    const { result, client } = renderHookWithQueryClient(() => useLogin());
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries');
    await result.current.mutateAsync({ username: 'bee', password: 'pw' });
    expect(TokenService.getAccessToken()).toBe('a');
    expect(TokenService.getRefreshToken()).toBe('r');
    expect(invalidateSpy.mock.calls.map((c) => c[0]?.queryKey)).toContainEqual([
      'me',
    ]);
  });

  it('useRegister stores tokens and invalidates me', async () => {
    server.use(
      http.post(`${BASE}/api/v1/auth/register`, () =>
        HttpResponse.json({
          access_token: 'a2',
          refresh_token: 'r2',
          token_type: 'bearer',
        }),
      ),
    );
    const { result } = renderHookWithQueryClient(() => useRegister());
    await result.current.mutateAsync({
      username: 'bee',
      email: 'b@b.com',
      password: 'pw',
    });
    expect(TokenService.getAccessToken()).toBe('a2');
  });

  it('useLogout best-effort revokes, clears tokens, and clears the cache', async () => {
    let logoutCalls = 0;
    server.use(
      http.post(`${BASE}/api/v1/auth/logout`, () => {
        logoutCalls++;
        return HttpResponse.json({}, { status: 204 });
      }),
    );
    TokenService.set({
      access_token: 'a',
      refresh_token: 'r',
      token_type: 'bearer',
    });
    const { result, client } = renderHookWithQueryClient(() => useLogout());
    const clearSpy = vi.spyOn(client, 'clear');
    await result.current.mutateAsync();
    await waitFor(() => expect(logoutCalls).toBe(1));
    expect(TokenService.getAccessToken()).toBeNull();
    expect(clearSpy).toHaveBeenCalled();
  });

  it('useLogout clears tokens even when revocation fails', async () => {
    server.use(
      http.post(`${BASE}/api/v1/auth/logout`, () =>
        HttpResponse.json({ detail: 'no' }, { status: 500 }),
      ),
    );
    TokenService.set({
      access_token: 'a',
      refresh_token: 'r',
      token_type: 'bearer',
    });
    const { result } = renderHookWithQueryClient(() => useLogout());
    await result.current.mutateAsync();
    expect(TokenService.getAccessToken()).toBeNull();
  });
});
