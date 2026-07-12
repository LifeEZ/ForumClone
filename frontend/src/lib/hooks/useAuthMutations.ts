import { useMutation, useQueryClient } from '@tanstack/react-query';
import { loginUser, logoutUser, registerUser } from '@/lib/api';
import { loggedIn } from '@/lib/invalidations';
import { TokenService } from '@/lib/tokenService';

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { username: string; password: string }) =>
      loginUser(payload),
    onSuccess: (tokens) => {
      TokenService.set(tokens);
      loggedIn(qc);
    },
  });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      username: string;
      email: string;
      password: string;
    }) => registerUser(payload),
    onSuccess: (tokens) => {
      TokenService.set(tokens);
      loggedIn(qc);
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const refreshToken = TokenService.getRefreshToken();
      if (refreshToken) {
        try {
          await logoutUser(refreshToken);
        } catch {
          // Revocation is best-effort; clear locally regardless.
        }
      }
      TokenService.clear();
    },
    onSuccess: () => {
      qc.clear();
    },
  });
}
