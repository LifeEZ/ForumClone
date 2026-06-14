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
  clearStoredTokens,
  fetchCurrentUser,
  getStoredTokens,
  loginUser,
  logoutUser,
  refreshTokens,
  registerUser,
  storeTokens,
} from '@/lib/api';

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
  const { accessToken, refreshToken } = getStoredTokens();
  if (!accessToken) return null;

  try {
    return await fetchCurrentUser(accessToken);
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 401 || !refreshToken) {
      clearStoredTokens();
      return null;
    }
  }

  try {
    const tokens = await refreshTokens(refreshToken!);
    storeTokens(tokens);
    return await fetchCurrentUser(tokens.access_token);
  } catch {
    clearStoredTokens();
    return null;
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
    storeTokens(tokens);
    const me = await fetchCurrentUser(tokens.access_token);
    setUser(me);
  }, []);

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      const tokens = await registerUser({ username, email, password });
      storeTokens(tokens);
      const me = await fetchCurrentUser(tokens.access_token);
      setUser(me);
    },
    [],
  );

  const logout = useCallback(async () => {
    const { refreshToken } = getStoredTokens();
    if (refreshToken) {
      try {
        await logoutUser(refreshToken);
      } catch {
        // Revocation is best-effort once tokens are cleared locally.
      }
    }
    clearStoredTokens();
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
