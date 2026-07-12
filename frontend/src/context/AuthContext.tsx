'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  ApiError,
  ApiUser,
  SessionExpiredError,
  fetchCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
} from '@/lib/api';
import { TokenService } from '@/lib/tokenService';

interface AuthContextType {
  user: ApiUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function loadUserFromStorage(): Promise<ApiUser | null> {
  const accessToken = TokenService.getAccessToken();
  if (!accessToken) return null;

  const MAX_ATTEMPTS = 5;
  const BASE_DELAY_MS = 1000;

  for (let attempt = 0; ; attempt++) {
    try {
      return await fetchCurrentUser();
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        TokenService.clear();
        return null;
      }
      const isTransient =
        err instanceof ApiError && (err.status === 429 || err.status >= 500);
      if (!isTransient || attempt >= MAX_ATTEMPTS) {
        return null;
      }
      const delay = BASE_DELAY_MS * 2 ** attempt;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    loadUserFromStorage().then((loaded) => {
      if (!cancelled) {
        setUser(loaded);
        setIsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const tokens = await loginUser({ username, password });
    TokenService.set(tokens);
    const me = await fetchCurrentUser();
    setUser(me);
  }, []);

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      const tokens = await registerUser({ username, email, password });
      TokenService.set(tokens);
      const me = await fetchCurrentUser();
      setUser(me);
    },
    [],
  );

  const logout = useCallback(async () => {
    const refreshToken = TokenService.getRefreshToken();
    if (refreshToken) {
      try {
        await logoutUser(refreshToken);
      } catch {
        // Revocation is best-effort once tokens are cleared locally.
      }
    }
    TokenService.clear();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
