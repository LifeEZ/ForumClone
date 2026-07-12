import type { QueryClient } from '@tanstack/react-query';

export const queryKeys = {
  me: ['me'] as const,
  communities: ['communities'] as const,
  home: ['home'] as const,
  community: (name: string) => ['community', name] as const,
  communityPosts: (name: string) => ['community', name, 'posts'] as const,
  post: (postId: string) => ['post', postId] as const,
  comments: (postId: string) => ['post', postId, 'comments'] as const,
};

export function communityMembership(qc: QueryClient, name: string): void {
  void qc.invalidateQueries({ queryKey: queryKeys.community(name) });
  void qc.invalidateQueries({ queryKey: queryKeys.communities });
  void qc.invalidateQueries({ queryKey: queryKeys.home });
}

export function postVote(qc: QueryClient, postId: string): void {
  void qc.invalidateQueries({ queryKey: queryKeys.post(postId) });
  void qc.invalidateQueries({ queryKey: queryKeys.home });
}

export function communityCreated(qc: QueryClient): void {
  void qc.invalidateQueries({ queryKey: queryKeys.communities });
}

export function postCreated(qc: QueryClient, communityName: string): void {
  void qc.invalidateQueries({
    queryKey: queryKeys.communityPosts(communityName),
  });
  void qc.invalidateQueries({ queryKey: queryKeys.home });
}

export function commentCreated(qc: QueryClient, postId: string): void {
  void qc.invalidateQueries({ queryKey: queryKeys.comments(postId) });
  void qc.invalidateQueries({ queryKey: queryKeys.post(postId) });
}
