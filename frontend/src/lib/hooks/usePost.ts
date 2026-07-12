import { useQuery } from '@tanstack/react-query';
import { fetchPost } from '@/lib/api';
import { queryKeys } from '@/lib/invalidations';
import { mapApiPost } from '@/lib/mappers';
import type { Post } from '@/types';

export function usePost(postId: string) {
  return useQuery<Post>({
    queryKey: queryKeys.post(postId),
    queryFn: async ({ signal }) => {
      const data = await fetchPost(postId, signal);
      return mapApiPost(data);
    },
    enabled: !!postId,
    staleTime: 10_000,
  });
}
