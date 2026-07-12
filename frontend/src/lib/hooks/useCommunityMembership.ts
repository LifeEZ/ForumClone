import { useMutation, useQueryClient } from '@tanstack/react-query';
import { joinCommunity, leaveCommunity } from '@/lib/api';
import { communityMembership } from '@/lib/invalidations';

export function useJoinCommunity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => joinCommunity(name),
    onSuccess: (_data, name) => communityMembership(qc, name),
  });
}

export function useLeaveCommunity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => leaveCommunity(name),
    onSuccess: (_data, name) => communityMembership(qc, name),
  });
}
