import { useQuery } from '@tanstack/react-query';
import { fetchCommunity, fetchCommunityPosts } from '@/lib/api';
import { queryKeys } from '@/lib/invalidations';
import { mapApiCommunity, mapApiPost } from '@/lib/mappers';
import type { Community, Post } from '@/types';

export function useCommunity(
  name: string,
  options: { authenticated?: boolean } = {},
) {
  return useQuery<Community>({
    queryKey: queryKeys.community(name),
    queryFn: async ({ signal }) => {
      const data = await fetchCommunity(name, {
        authenticated: options.authenticated,
        signal,
      });
      return mapApiCommunity(data);
    },
    enabled: !!name,
    staleTime: 10_000,
  });
}

export function useCommunityPosts(name: string) {
  return useQuery<Post[]>({
    queryKey: queryKeys.communityPosts(name),
    queryFn: async ({ signal }) => {
      const data = await fetchCommunityPosts(name, { signal });
      return data.map(mapApiPost);
    },
    enabled: !!name,
    staleTime: 10_000,
  });
}
