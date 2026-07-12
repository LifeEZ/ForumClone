import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';
import { waitFor } from '@testing-library/react';
import { server } from '@/test/server';
import { renderHookWithQueryClient } from '@/test/query-test-utils';
import { TokenService } from '@/lib/tokenService';
import { useComments } from '@/lib/hooks/useComments';
import { useCommunities } from '@/lib/hooks/useCommunities';
import { useCommunity } from '@/lib/hooks/useCommunity';
import { usePost } from '@/lib/hooks/usePost';

const BASE = 'http://localhost:8000';

const community = (over: Partial<Record<string, unknown>> = {}) => ({
  id: 'c1',
  name: 'films',
  display_name: 'Films',
  description: null,
  rules: null,
  icon_url: null,
  banner_url: null,
  creator_id: 'u1',
  member_count: 5,
  created_at: 'now',
  ...over,
});

const post = (over: Partial<Record<string, unknown>> = {}) => ({
  id: 'p1',
  title: 'Hello',
  content: 'body',
  community_id: 'c1',
  author: {
    id: 'u1',
    username: 'bee',
    display_name: null,
    bio: null,
    avatar_url: null,
    created_at: 'now',
  },
  score: 1,
  upvotes: 1,
  downvotes: 0,
  user_vote: 0,
  comment_count: 0,
  created_at: 'now',
  is_deleted: false,
  ...over,
});

afterEach(() => {
  TokenService.clear();
  server.resetHandlers();
});

describe('useCommunities', () => {
  it('returns mapped communities with joined membership for authed user', async () => {
    server.use(
      http.get(`${BASE}/api/v1/communities`, () =>
        HttpResponse.json([
          community({ id: 'c1' }),
          community({ id: 'c2', name: 'books' }),
        ]),
      ),
      http.get(`${BASE}/api/v1/communities/mine`, () =>
        HttpResponse.json([community({ id: 'c2', name: 'books' })]),
      ),
    );
    TokenService.set({
      access_token: 'a',
      refresh_token: 'r',
      token_type: 'bearer',
    });

    const { result } = renderHookWithQueryClient(() => useCommunities());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const list = result.current.data!;
    expect(list).toHaveLength(2);
    expect(list[0].isJoined).toBe(false);
    expect(list[1].isJoined).toBe(true);
    expect(list[0].displayName).toBe('Films');
  });

  it('returns communities without joined fetch when unauthed', async () => {
    let mineCalls = 0;
    server.use(
      http.get(`${BASE}/api/v1/communities`, () =>
        HttpResponse.json([community()]),
      ),
      http.get(`${BASE}/api/v1/communities/mine`, () => {
        mineCalls++;
        return HttpResponse.json([]);
      }),
    );

    const { result } = renderHookWithQueryClient(() => useCommunities());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].isJoined).toBe(false);
    expect(mineCalls).toBe(0);
  });
});

describe('useCommunity', () => {
  it('returns a mapped community', async () => {
    server.use(
      http.get(`${BASE}/api/v1/communities/films`, () =>
        HttpResponse.json(community()),
      ),
    );
    const { result } = renderHookWithQueryClient(() => useCommunity('films'));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data!.name).toBe('films');
    expect(result.current.data!.displayName).toBe('Films');
  });

  it('is disabled when name is empty', () => {
    const { result } = renderHookWithQueryClient(() => useCommunity(''));
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useCommunityPosts (in useCommunity module)', () => {
  it('returns mapped posts', async () => {
    server.use(
      http.get(`${BASE}/api/v1/communities/films/posts`, () =>
        HttpResponse.json([post()]),
      ),
    );
    const { useCommunityPosts } = await import('@/lib/hooks/useCommunity');
    const { result } = renderHookWithQueryClient(() =>
      useCommunityPosts('films'),
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data![0].title).toBe('Hello');
  });
});

describe('usePost', () => {
  it('returns a mapped post', async () => {
    server.use(
      http.get(`${BASE}/api/v1/posts/p1`, () => HttpResponse.json(post())),
    );
    const { result } = renderHookWithQueryClient(() => usePost('p1'));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data!.title).toBe('Hello');
  });
});

describe('useComments', () => {
  it('returns mapped comments', async () => {
    server.use(
      http.get(`${BASE}/api/v1/posts/p1/comments`, () =>
        HttpResponse.json([
          {
            id: 'cm1',
            content: 'nice',
            post_id: 'p1',
            author: {
              id: 'u1',
              username: 'bee',
              display_name: null,
              bio: null,
              avatar_url: null,
              created_at: 'now',
            },
            parent_id: null,
            depth: 0,
            score: 2,
            created_at: 'now',
            is_deleted: false,
            user_vote: null,
            replies: [],
          },
        ]),
      ),
    );
    const { result } = renderHookWithQueryClient(() => useComments('p1'));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data![0].content).toBe('nice');
    expect(result.current.data![0].upvotes).toBe(2);
  });
});
