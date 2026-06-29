'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { Post, Community, Comment, User } from '@/types';
import { useAuth } from '@/context/AuthContext';
import {
  ApiError,
  ApiUser,
  fetchCommunities,
  fetchCommunity,
  fetchJoinedCommunities,
  getStoredTokens,
  joinCommunity,
  leaveCommunity,
} from '@/lib/api';
import { mapApiCommunity } from '@/lib/mappers';
import { mockComments } from '@/data/mockData';

function mapAuthUser(apiUser: ApiUser): User {
  return {
    id: apiUser.id,
    username: apiUser.username,
    avatarUrl: apiUser.avatar_url,
    karma: apiUser.karma,
  };
}

interface AppContextType {
  communities: Community[];
  communitiesLoading: boolean;
  communitiesError: string | null;
  joinError: string | null;
  comments: Record<string, Comment[]>;
  user: User | null;
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

  const applyJoinedState = useCallback(async () => {
    if (!authUser) {
      setCommunities((prev) => prev.map((c) => ({ ...c, isJoined: false })));
      return;
    }

    const { accessToken } = getStoredTokens();
    if (!accessToken) return;

    try {
      const joined = await fetchJoinedCommunities(accessToken);
      const joinedIds = new Set(joined.map((j) => j.id));
      const joinedById = new Map(joined.map((j) => [j.id, j]));
      setCommunities((prev) =>
        prev.map((c) => {
          const fresh = joinedById.get(c.id);
          return fresh
            ? mapApiCommunity(fresh, true)
            : { ...c, isJoined: joinedIds.has(c.id) };
        }),
      );
    } catch {
      // Joined list is best-effort; leave existing state.
    }
  }, [authUser]);

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;

    async function loadCommunities() {
      setCommunitiesLoading(true);
      setCommunitiesError(null);
      try {
        const data = await fetchCommunities();
        if (cancelled) return;

        let joinedIds = new Set<string>();
        if (authUser) {
          const { accessToken } = getStoredTokens();
          if (accessToken) {
            try {
              const joined = await fetchJoinedCommunities(accessToken);
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
        if (cancelled) return;
        const message =
          err instanceof ApiError
            ? err.message
            : 'Could not load communities';
        setCommunitiesError(message);
      } finally {
        if (!cancelled) setCommunitiesLoading(false);
      }
    }

    void loadCommunities();
    return () => {
      cancelled = true;
    };
  }, [authUser, authLoading]);

  useEffect(() => {
    void applyJoinedState();
  }, [applyJoinedState]);

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
        await leaveCommunity(accessToken, community.name);
      } else {
        await joinCommunity(accessToken, community.name);
      }
      const updated = await fetchCommunity(community.name, accessToken);
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
