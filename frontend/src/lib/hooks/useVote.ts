import { useMutation, useQueryClient } from '@tanstack/react-query';
import { castVote, type ApiVoteResponse } from '@/lib/api';
import { postVote } from '@/lib/invalidations';

export function useVote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: castVote,
    onSuccess: (data: ApiVoteResponse) => {
      if (data.target_type === 'post') {
        postVote(qc, data.target_id);
      }
    },
  });
}
