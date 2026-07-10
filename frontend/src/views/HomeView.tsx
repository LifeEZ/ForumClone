'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/motion';
import { useAuth } from '@/context/AuthContext';
import { useAppContext } from '@/context/AppContext';
import { CommunitiesStrip } from '@/components/CommunitiesStrip';
import { PostCard } from '@/components/PostCard';
import { SortBar } from '@/components/SortBar';
import {
  ApiError,
  fetchGlobalPosts,
  fetchHomePosts,
  getStoredTokens,
} from '@/lib/api';
import { mapApiPost, updatePostVote } from '@/lib/mappers';
import { Post } from '@/types';

export function HomeView() {
  const { user, isLoading: authLoading } = useAuth();
  const { communities } = useAppContext();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPersonalizationBanner, setShowPersonalizationBanner] =
    useState(false);

  const joinedCount = communities.filter((c) => c.isJoined).length;

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;

    async function loadPosts() {
      setLoading(true);
      setError(null);
      setShowPersonalizationBanner(false);

      try {
        if (user) {
          const { accessToken } = getStoredTokens();
          if (!accessToken) {
            const data = await fetchGlobalPosts({ limit: 20 });
            if (cancelled) return;
            setPosts(data.map(mapApiPost));
            return;
          }

          const homeData = await fetchHomePosts({ limit: 20 });
          if (cancelled) return;

          if (homeData.length > 0) {
            setPosts(homeData.map(mapApiPost));
            return;
          }

          const hasJoins = joinedCount > 0;
          if (!hasJoins) {
            const globalData = await fetchGlobalPosts({ limit: 20 });
            if (cancelled) return;
            setPosts(globalData.map(mapApiPost));
            setShowPersonalizationBanner(true);
          } else {
            setPosts([]);
          }
        } else {
          const data = await fetchGlobalPosts({ limit: 20 });
          if (cancelled) return;
          setPosts(data.map(mapApiPost));
        }
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof ApiError ? err.message : 'Could not load posts',
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadPosts();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, joinedCount]);

  const handleVote = (postId: string, vote: 1 | -1 | 0) => {
    setPosts((prev) => updatePostVote(prev, postId, vote));
  };

  return (
    <div className="w-full">
      <CommunitiesStrip />
      <SortBar />

      {showPersonalizationBanner && (
        <div className="mb-6 rounded-2xl border border-forest-accent/30 bg-forest-accent/10 px-4 py-3 text-sm text-forest-text">
          You haven&apos;t joined any communities yet.{' '}
          <Link
            href="/c/films"
            className="font-semibold text-forest-accent hover:text-forest-accent-hover underline-offset-2 hover:underline"
          >
            Explore communities
          </Link>{' '}
          to personalize your home feed.
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-forest-muted">
          Gathering posts…
        </div>
      ) : error ? (
        <div className="text-center py-20 bg-forest-surface/80 border border-forest-border/40 rounded-2xl shadow-md shadow-black/10">
          <h2 className="font-display text-xl font-semibold text-forest-text mb-2">
            Could not load feed
          </h2>
          <p className="text-forest-muted">{error}</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 bg-forest-surface/80 border border-forest-border/40 rounded-2xl shadow-md shadow-black/10">
          <h2 className="font-display text-xl font-semibold text-forest-text mb-2">
            {user && joinedCount > 0 ? 'Nothing from your communities' : 'Nothing here yet'}
          </h2>
          <p className="text-forest-muted">
            {user && joinedCount > 0
              ? 'Posts from communities you joined will show up here.'
              : 'Be the first to post — or join a community to see its feed here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {posts.map((post, index) => {
            const community = communities.find(
              (c) => c.id === post.communityId,
            );
            return (
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
                  onVote={(vote) => handleVote(post.id, vote)}
                />
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
