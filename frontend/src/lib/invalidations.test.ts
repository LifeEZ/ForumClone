import { describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import {
  commentCreated,
  communityCreated,
  communityMembership,
  postCreated,
  postVote,
  queryKeys,
} from '@/lib/invalidations';

function spy(qc: QueryClient) {
  return vi.spyOn(qc, 'invalidateQueries');
}

function keys(calls: ReturnType<typeof spy>) {
  return calls.mock.calls.map((c) => c[0]?.queryKey);
}

describe('queryKeys', () => {
  it('builds entity-first flat tuples', () => {
    expect(queryKeys.me).toEqual(['me']);
    expect(queryKeys.communities).toEqual(['communities']);
    expect(queryKeys.community('films')).toEqual(['community', 'films']);
    expect(queryKeys.communityPosts('films')).toEqual([
      'community',
      'films',
      'posts',
    ]);
    expect(queryKeys.post('p1')).toEqual(['post', 'p1']);
    expect(queryKeys.comments('p1')).toEqual(['post', 'p1', 'comments']);
    expect(queryKeys.home).toEqual(['home']);
  });
});

describe('invalidation helpers', () => {
  it('communityMembership invalidates community, communities, and home', () => {
    const qc = new QueryClient();
    const s = spy(qc);
    communityMembership(qc, 'films');
    expect(keys(s)).toEqual([
      ['community', 'films'],
      ['communities'],
      ['home'],
    ]);
  });

  it('postVote invalidates the post (prefix covers comments) and home feed', () => {
    const qc = new QueryClient();
    const s = spy(qc);
    postVote(qc, 'p1');
    expect(keys(s)).toEqual([['post', 'p1'], ['home']]);
  });

  it('communityCreated invalidates communities list', () => {
    const qc = new QueryClient();
    const s = spy(qc);
    communityCreated(qc);
    expect(keys(s)).toEqual([['communities']]);
  });

  it('postCreated invalidates community posts and home', () => {
    const qc = new QueryClient();
    const s = spy(qc);
    postCreated(qc, 'films');
    expect(keys(s)).toEqual([['community', 'films', 'posts'], ['home']]);
  });

  it('commentCreated invalidates comments and the post (comment_count)', () => {
    const qc = new QueryClient();
    const s = spy(qc);
    commentCreated(qc, 'p1');
    expect(keys(s)).toEqual([
      ['post', 'p1', 'comments'],
      ['post', 'p1'],
    ]);
  });
});
