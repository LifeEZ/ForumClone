import { useQuery } from '@tanstack/react-query';
import { fetchComments } from '@/lib/api';
import { queryKeys } from '@/lib/invalidations';
import { mapApiComment } from '@/lib/mappers';
import type { Comment } from '@/types';

export function useComments(postId: string) {
  return useQuery<Comment[]>({
    queryKey: queryKeys.comments(postId),
    queryFn: async ({ signal }) => {
      const data = await fetchComments(postId, signal);
      return data.map(mapApiComment);
    },
    enabled: !!postId,
    staleTime: 5_000,
  });
}
