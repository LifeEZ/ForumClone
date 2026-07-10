'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { Post, Community, Comment } from '@/types';
import { useAuth } from '@/context/AuthContext';
import {
  ApiError,
  fetchCommunities,
  fetchCommunity,
  fetchJoinedCommunities,
  getStoredTokens,
  joinCommunity,
  leaveCommunity,
} from '@/lib/api';
import { mapApiCommunity, mapAuthUser } from '@/lib/mappers';
import { mockComments } from '@/data/mockData';

interface AppContextType {
  /** Shared communities cache for shell chrome (nav, sidebars). Page views fetch their own data. */
  communities: Community[];
  communitiesLoading: boolean;
  communitiesError: string | null;
  joinError: string | null;
  /** Mock comment threads — replace with api.ts in slice 6. */
  comments: Record<string, Comment[]>;
  user: ReturnType<typeof mapAuthUser> | null;
  refreshCommunities: () => Promise<void>;
  toggleJoinCommunity: (communityId: string) => Promise<void>;
  votePost: (postId: string, vote: 1 | -1 | 0) => void;
  voteComment: (postId: string, commentId: string, vote: 1 | -1 | 0) => void;
  addPost: (
    post: Omit<
      Post,
      | 'id'
      | 'createdAt'
      | 'upvotes'
      | 'downvotes'
      | 'userVote'
      | 'commentCount'
      | 'author'
    >,
  ) => string;
  addComment: (
    postId: string,
    parentId: string | null,
    content: string,
  ) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user: authUser, isLoading: authLoading } = useAuth();
  const user = authUser ? mapAuthUser(authUser) : null;

  const [communities, setCommunities] = useState<Community[]>([]);
  const [communitiesLoading, setCommunitiesLoading] = useState(true);
  const [communitiesError, setCommunitiesError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [comments, setComments] =
    useState<Record<string, Comment[]>>(mockComments);

  const loadCommunities = useCallback(async () => {
    setCommunitiesLoading(true);
    setCommunitiesError(null);
    try {
      const data = await fetchCommunities();

      let joinedIds = new Set<string>();
      if (authUser) {
        const { accessToken } = getStoredTokens();
        if (accessToken) {
          try {
            const joined = await fetchJoinedCommunities();
            joinedIds = new Set(joined.map((j) => j.id));
          } catch {
            // Fall back to unjoined state for all communities.
          }
        }
      }

      setCommunities(
        data.map((c) => mapApiCommunity(c, joinedIds.has(c.id))),
      );
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Could not load communities';
      setCommunitiesError(message);
    } finally {
      setCommunitiesLoading(false);
    }
  }, [authUser]);

  const refreshCommunities = useCallback(async () => {
    await loadCommunities();
  }, [loadCommunities]);

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;

    async function run() {
      await loadCommunities();
      if (cancelled) return;
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [authLoading, loadCommunities]);

  const toggleJoinCommunity = async (communityId: string) => {
    const community = communities.find((c) => c.id === communityId);
    if (!community) return;

    const { accessToken } = getStoredTokens();
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
              memberCount: wasJoined
                ? c.memberCount - 1
                : c.memberCount + 1,
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
        prev.map((c) =>
          c.id === communityId ? mapApiCommunity(updated) : c,
        ),
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

  const votePost = (_postId: string, _vote: 1 | -1 | 0) => {
    // Wired in slice 7; per-view local state handles display until then.
  };

  const voteCommentRecursive = (
    commentList: Comment[],
    commentId: string,
    vote: 1 | -1 | 0,
  ): Comment[] => {
    return commentList.map((c) => {
      if (c.id === commentId) {
        let newUpvotes = c.upvotes;
        let newDownvotes = c.downvotes;
        if (c.userVote === 1) newUpvotes--;
        if (c.userVote === -1) newDownvotes--;
        if (vote === 1) newUpvotes++;
        if (vote === -1) newDownvotes++;
        return {
          ...c,
          upvotes: newUpvotes,
          downvotes: newDownvotes,
          userVote: vote,
        };
      }
      if (c.replies) {
        return {
          ...c,
          replies: voteCommentRecursive(c.replies, commentId, vote),
        };
      }
      return c;
    });
  };

  const voteComment = (postId: string, commentId: string, vote: 1 | -1 | 0) => {
    setComments((prev) => ({
      ...prev,
      [postId]: voteCommentRecursive(prev[postId] || [], commentId, vote),
    }));
  };

  const addPost = (
    _postData: Omit<
      Post,
      | 'id'
      | 'createdAt'
      | 'upvotes'
      | 'downvotes'
      | 'userVote'
      | 'commentCount'
      | 'author'
    >,
  ) => {
    if (!user) return '';
    return `p_${Date.now()}`;
  };

  const addComment = (
    _postId: string,
    _parentId: string | null,
    _content: string,
  ) => {
    // Disabled until slice 6.
  };

  return (
    <AppContext.Provider
      value={{
        communities,
        communitiesLoading,
        communitiesError,
        joinError,
        comments,
        user,
        refreshCommunities,
        toggleJoinCommunity,
        votePost,
        voteComment,
        addPost,
        addComment,
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
