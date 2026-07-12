import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';
import { server } from '@/test/server';
import {
  ApiError,
  SessionExpiredError,
  fetchCurrentUser,
  fetchGlobalPosts,
} from '@/lib/api';
import { TokenService } from '@/lib/tokenService';

const BASE = 'http://localhost:8000';

afterEach(() => {
  TokenService.clear();
});

describe('api transport (post-refactor)', () => {
  it('requestWithAuth: 401 triggers refresh then retries with new token', async () => {
    let meCalls = 0;
    let refreshCalls = 0;
    server.use(
      http.get(`${BASE}/api/v1/users/me`, ({ request }) => {
        meCalls++;
        const auth = request.headers.get('Authorization');
        if (auth === 'Bearer expired') {
          return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 });
        }
        return HttpResponse.json({
          id: 'u1',
          username: 'bee',
          email: 'b@b',
          display_name: null,
          bio: null,
          avatar_url: null,
          karma: 0,
          is_active: true,
          created_at: 'now',
        });
      }),
      http.post(`${BASE}/api/v1/auth/refresh`, () => {
        refreshCalls++;
        return HttpResponse.json({
          access_token: 'fresh',
          refresh_token: 'rfresh',
          token_type: 'bearer',
        });
      }),
    );

    TokenService.set({
      access_token: 'expired',
      refresh_token: 'rexp',
      token_type: 'bearer',
    });

    const me = await fetchCurrentUser();
    expect(me.username).toBe('bee');
    expect(meCalls).toBe(2);
    expect(refreshCalls).toBe(1);
    expect(TokenService.getAccessToken()).toBe('fresh');
  });

  it('requestWithAuth with no access token throws SessionExpiredError', async () => {
    server.use(
      http.get(`${BASE}/api/v1/users/me`, () =>
        HttpResponse.json({ detail: 'no' }, { status: 401 }),
      ),
    );
    await expect(fetchCurrentUser()).rejects.toBeInstanceOf(SessionExpiredError);
  });

  it('refresh 401 → SessionExpiredError', async () => {
    server.use(
      http.get(`${BASE}/api/v1/users/me`, () =>
        HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 }),
      ),
      http.post(`${BASE}/api/v1/auth/refresh`, () =>
        HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 }),
      ),
    );
    TokenService.set({
      access_token: 'expired',
      refresh_token: 'rexp',
      token_type: 'bearer',
    });
    await expect(fetchCurrentUser()).rejects.toBeInstanceOf(
      SessionExpiredError,
    );
  });

  it('non-401 errors throw ApiError', async () => {
    server.use(
      http.get(`${BASE}/api/v1/users/me`, () =>
        HttpResponse.json({ detail: 'boom' }, { status: 500 }),
      ),
    );
    TokenService.set({
      access_token: 'good',
      refresh_token: 'r',
      token_type: 'bearer',
    });
    await expect(fetchCurrentUser()).rejects.toSatisfy((e: unknown) => {
      return e instanceof ApiError && e.status === 500;
    });
  });

  it('transport does not retry 429 (RQ owns retry now)', async () => {
    let calls = 0;
    server.use(
      http.get(`${BASE}/api/v1/posts`, () => {
        calls++;
        return HttpResponse.json({ detail: 'slow down' }, { status: 429 });
      }),
    );
    await expect(fetchGlobalPosts()).rejects.toSatisfy((e: unknown) => {
      return e instanceof ApiError && e.status === 429;
    });
    expect(calls).toBe(1);
  });

  it('refresh token de-dups concurrent refreshes', async () => {
    let refreshCalls = 0;
    server.use(
      http.get(`${BASE}/api/v1/users/me`, ({ request }) => {
        const auth = request.headers.get('Authorization');
        if (auth === 'Bearer expired') {
          return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 });
        }
        return HttpResponse.json({
          id: 'u',
          username: 'u',
          email: 'u',
          display_name: null,
          bio: null,
          avatar_url: null,
          karma: 0,
          is_active: true,
          created_at: 'n',
        });
      }),
      http.post(`${BASE}/api/v1/auth/refresh`, async () => {
        refreshCalls++;
        await new Promise((r) => setTimeout(r, 20));
        return HttpResponse.json({
          access_token: 'fresh',
          refresh_token: 'rfresh',
          token_type: 'bearer',
        });
      }),
    );
    TokenService.set({
      access_token: 'expired',
      refresh_token: 'rexp',
      token_type: 'bearer',
    });
    await Promise.all([fetchCurrentUser(), fetchCurrentUser()]);
    expect(refreshCalls).toBe(1);
  });
});