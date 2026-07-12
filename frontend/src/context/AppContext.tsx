'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { Community } from '@/types';
import { useAuth } from '@/context/AuthContext';
import {
  ApiError,
  fetchCommunities,
  fetchCommunity,
  fetchJoinedCommunities,
  joinCommunity,
  leaveCommunity,
} from '@/lib/api';
import { TokenService } from '@/lib/tokenService';
import { mapApiCommunity, mapAuthUser } from '@/lib/mappers';

interface AppContextType {
  communities: Community[];
  communitiesLoading: boolean;
  communitiesError: string | null;
  joinError: string | null;
  joinedCount: number;
  user: ReturnType<typeof mapAuthUser> | null;
  refreshCommunities: () => Promise<void>;
  toggleJoinCommunity: (communityId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user: authUser, isLoading: authLoading } = useAuth();
  const user = authUser ? mapAuthUser(authUser) : null;

  const [communities, setCommunities] = useState<Community[]>([]);
  const [communitiesLoading, setCommunitiesLoading] = useState(true);
  const [communitiesError, setCommunitiesError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinedCount, setJoinedCount] = useState(0);

  const loadCommunities = useCallback(
    async (signal?: AbortSignal) => {
      setCommunitiesLoading(true);
      setCommunitiesError(null);
      try {
        const data = await fetchCommunities(signal);

        let joinedIds = new Set<string>();
        if (authUser) {
          const accessToken = TokenService.getAccessToken();
          if (accessToken) {
            try {
              const joined = await fetchJoinedCommunities(signal);
              joinedIds = new Set(joined.map((j) => j.id));
              setJoinedCount(joined.length);
            } catch {
              setJoinedCount(0);
            }
          } else {
            setJoinedCount(0);
          }
        } else {
          setJoinedCount(0);
        }

        if (signal?.aborted) return;
        setCommunities(
          data.map((c) => mapApiCommunity(c, joinedIds.has(c.id))),
        );
      } catch (err) {
        if (signal?.aborted) return;
        if (err instanceof DOMException && err.name === 'AbortError') return;
        const message =
          err instanceof ApiError ? err.message : 'Could not load communities';
        setCommunitiesError(message);
      } finally {
        if (!signal?.aborted) setCommunitiesLoading(false);
      }
    },
    [authUser],
  );

  const refreshCommunities = useCallback(async () => {
    await loadCommunities();
  }, [loadCommunities]);

  useEffect(() => {
    if (authLoading) return;

    const controller = new AbortController();

    async function run() {
      await loadCommunities(controller.signal);
    }

    void run();
    return () => {
      controller.abort();
    };
  }, [authLoading, loadCommunities]);

  const toggleJoinCommunity = async (communityId: string) => {
    const community = communities.find((c) => c.id === communityId);
    if (!community) return;

    const accessToken = TokenService.getAccessToken();
    if (!accessToken) return;

    const wasJoined = community.isJoined;
    const previousMemberCount = community.memberCount;
    setJoinError(null);

    setCommunities((prev) =>
      prev.map((c) =>
        c.id === communityId
          ? {
              ...c,
              isJoined: !wasJoined,
              memberCount: wasJoined ? c.memberCount - 1 : c.memberCount + 1,
            }
          : c,
      ),
    );

    try {
      if (wasJoined) {
        await leaveCommunity(community.name);
      } else {
        await joinCommunity(community.name);
      }
      const updated = await fetchCommunity(community.name, {
        authenticated: true,
      });
      setCommunities((prev) =>
        prev.map((c) => (c.id === communityId ? mapApiCommunity(updated) : c)),
      );
    } catch (err) {
      setCommunities((prev) =>
        prev.map((c) =>
          c.id === communityId
            ? {
                ...c,
                isJoined: wasJoined,
                memberCount: previousMemberCount,
              }
            : c,
        ),
      );
      const message =
        err instanceof ApiError ? err.message : 'Could not update membership';
      setJoinError(message);
      throw err;
    }
  };

  return (
    <AppContext.Provider
      value={{
        communities,
        communitiesLoading,
        communitiesError,
        joinError,
        joinedCount,
        user,
        refreshCommunities,
        toggleJoinCommunity,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
