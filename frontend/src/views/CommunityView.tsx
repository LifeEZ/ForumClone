'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fadeIn, fadeUp } from '@/lib/motion';
import { useAuth } from '@/context/AuthContext';
import { useAppContext } from '@/context/AppContext';
import { CommunityPostActions } from '@/components/CommunityPostActions';
import { PostCard } from '@/components/PostCard';
import { SortBar } from '@/components/SortBar';
import { RemoteImage } from '@/components/RemoteImage';
import {
  ApiError,
  castVote,
  fetchCommunity,
  fetchCommunityPosts,
  joinCommunity,
  leaveCommunity,
} from '@/lib/api';
import { mapApiCommunity, mapApiPost, mapAuthUser, updatePostVote } from '@/lib/mappers';
import { Community, Post } from '@/types';

export function CommunityView({ name }: { name: string }) {
  const { user: authUser, isLoading: authLoading } = useAuth();
  const user = authUser ? mapAuthUser(authUser) : null;
  const { refreshCommunities } = useAppContext();

  const [community, setCommunity] = useState<Community | null>(null);
  const [communityLoading, setCommunityLoading] = useState(true);
  const [communityError, setCommunityError] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinLoading, setJoinLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;

    async function loadCommunity() {
      setCommunityLoading(true);
      setCommunityError(null);
      try {
        const data = await fetchCommunity(name, { authenticated: !!authUser });
        if (cancelled) return;
        setCommunity(mapApiCommunity(data));
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setCommunity(null);
          setCommunityError('not_found');
        } else {
          setCommunityError(
            err instanceof ApiError ? err.message : 'Could not load community',
          );
        }
      } finally {
        if (!cancelled) setCommunityLoading(false);
      }
    }

    void loadCommunity();
    return () => {
      cancelled = true;
    };
  }, [name, authUser, authLoading]);

  useEffect(() => {
    let cancelled = false;

    async function loadPosts() {
      setPostsLoading(true);
      setPostsError(null);
      try {
        const data = await fetchCommunityPosts(name, { limit: 20 });
        if (cancelled) return;
        setPosts(data.map(mapApiPost));
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setPostsError('not_found');
        } else {
          setPostsError(
            err instanceof ApiError ? err.message : 'Could not load posts',
          );
        }
      } finally {
        if (!cancelled) setPostsLoading(false);
      }
    }

    void loadPosts();
    return () => {
      cancelled = true;
    };
  }, [name]);

  const handleJoin = async () => {
    if (!community || joinLoading) return;

    setJoinLoading(true);
    setJoinError(null);

    const wasJoined = community.isJoined;
    const previousMemberCount = community.memberCount;

    setCommunity((prev) =>
      prev
        ? {
            ...prev,
            isJoined: !wasJoined,
            memberCount: wasJoined
              ? prev.memberCount - 1
              : prev.memberCount + 1,
          }
        : prev,
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
      setCommunity(mapApiCommunity(updated));
      await refreshCommunities();
    } catch (err) {
      setCommunity((prev) =>
        prev
          ? {
              ...prev,
              isJoined: wasJoined,
              memberCount: previousMemberCount,
            }
          : prev,
      );
      const message =
        err instanceof ApiError ? err.message : 'Could not update membership';
      setJoinError(message);
    } finally {
      setJoinLoading(false);
    }
  };

  const handleVote = async (postId: string, vote: 1 | -1 | 0) => {
    if (!authUser) return;
    const prev = posts;
    setPosts(updatePostVote(prev, postId, vote));
    try {
      await castVote({ target_type: 'post', target_id: postId, value: vote });
    } catch (err) {
      setPosts(prev);
      if (err instanceof ApiError && err.status === 401) {
        // token refresh failed; leave rolled-back state
      }
    }
  };

  if (!communityLoading && communityError === 'not_found') {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-forest-text">
          Community not found
        </h2>
      </div>
    );
  }

  if (communityLoading || !community) {
    return (
      <div className="text-center py-20 text-forest-muted">
        Loading community…
      </div>
    );
  }

  if (communityError) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-forest-text mb-2">
          Could not load community
        </h2>
        <p className="text-forest-muted">{communityError}</p>
      </div>
    );
  }

  return (
    <div className="w-full pb-24 sm:pb-0">
      <motion.div
        className="bg-forest-surface/95 border border-forest-border/40 rounded-2xl overflow-hidden mb-6 sm:mb-8 shadow-xl shadow-black/20"
        variants={fadeIn}
        initial="hidden"
        animate="visible"
      >
        <div className="relative h-32 sm:h-48 w-full bg-forest-bg">
          <RemoteImage
            src={community.bannerUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 672px"
            className="object-cover"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-forest-surface via-forest-surface/40 to-forest-glow/10"
            aria-hidden
          />
        </div>
        <div className="p-4 sm:p-6 relative">
          <div className="absolute -top-12 sm:-top-16 left-4 sm:left-6 p-1 bg-forest-surface rounded-full">
            <RemoteImage
              src={community.avatarUrl}
              alt=""
              width={112}
              height={112}
              className="w-20 h-20 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-forest-surface"
            />
          </div>

          <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-semibold text-forest-text">
                {community.displayName}
              </h1>
              <p className="text-forest-muted font-medium">
                c/{community.name}
              </p>
            </div>

            <div className="hidden sm:block">
              <CommunityPostActions
                community={community}
                user={user}
                onJoin={handleJoin}
                joinLoading={joinLoading}
              />
            </div>
          </div>

          <p className="mt-4 text-forest-text/90 max-w-2xl">
            {community.description}
          </p>
          {joinError && (
            <p className="mt-2 text-sm text-red-400" role="alert">
              {joinError}
            </p>
          )}
        </div>
      </motion.div>

      <SortBar />

      {postsLoading ? (
        <div className="text-center py-20 text-forest-muted">
          Gathering posts…
        </div>
      ) : postsError && postsError !== 'not_found' ? (
        <div className="text-center py-20 bg-forest-surface/80 border border-forest-border/40 rounded-2xl shadow-md shadow-black/10">
          <h2 className="font-display text-xl font-semibold text-forest-text mb-2">
            Could not load posts
          </h2>
          <p className="text-forest-muted">{postsError}</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 bg-forest-surface/80 border border-forest-border/40 rounded-2xl shadow-md shadow-black/10">
          <h2 className="font-display text-xl font-semibold text-forest-text mb-2">
            No posts yet
          </h2>
          <p className="text-forest-muted">
            Be the first to post in c/{community.name}.
          </p>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {posts.map((post, index) => (
            <motion.div
              key={post.id}
              custom={index}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
            >
              <PostCard
                post={post}
                community={community}
                showCommunity={false}
                onVote={(vote) => handleVote(post.id, vote)}
              />
            </motion.div>
          ))}
        </div>
      )}

      <div className="fixed bottom-0 inset-x-0 z-30 border-t border-forest-border bg-forest-bg/95 backdrop-blur-md p-4 sm:hidden">
        <CommunityPostActions
          community={community}
          user={user}
          onJoin={handleJoin}
          joinLoading={joinLoading}
          compact
        />
      </div>
    </div>
  );
}
