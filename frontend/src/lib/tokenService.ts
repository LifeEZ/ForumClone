import type { TokenPair } from '@/lib/api';

const ACCESS_TOKEN_KEY = 'hiver_access_token';
const REFRESH_TOKEN_KEY = 'hiver_refresh_token';

let accessToken: string | null = null;
let refreshToken: string | null = null;

function rehydrate(): void {
  if (typeof window === 'undefined') return;
  accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
}

rehydrate();

export const TokenService = {
  getAccessToken(): string | null {
    return accessToken;
  },
  getRefreshToken(): string | null {
    return refreshToken;
  },
  hasAccessToken(): boolean {
    return accessToken !== null;
  },
  set(tokens: TokenPair): void {
    accessToken = tokens.access_token;
    refreshToken = tokens.refresh_token;
    if (typeof window !== 'undefined') {
      localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
    }
  },
  clear(): void {
    accessToken = null;
    refreshToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  },
};
