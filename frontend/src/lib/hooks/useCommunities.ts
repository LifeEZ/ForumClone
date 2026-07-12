import { useQuery } from '@tanstack/react-query';
import { fetchCommunities, fetchJoinedCommunities } from '@/lib/api';
import { queryKeys } from '@/lib/invalidations';
import { mapApiCommunity } from '@/lib/mappers';
import { TokenService } from '@/lib/tokenService';
import type { Community } from '@/types';

export function useCommunities() {
  return useQuery<Community[]>({
    queryKey: queryKeys.communities,
    queryFn: async ({ signal }) => {
      const data = await fetchCommunities(signal);
      let joinedIds = new Set<string>();
      if (TokenService.hasAccessToken()) {
        try {
          const joined = await fetchJoinedCommunities(signal);
          joinedIds = new Set(joined.map((c) => c.id));
        } catch {
          joinedIds = new Set();
        }
      }
      return data.map((c) => mapApiCommunity(c, joinedIds.has(c.id)));
    },
    staleTime: 60_000,
  });
}
