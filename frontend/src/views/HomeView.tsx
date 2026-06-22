'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/motion';
import { useAppContext } from '@/context/AppContext';
import { CommunitiesStrip } from '@/components/CommunitiesStrip';
import { PostCard } from '@/components/PostCard';
import { SortBar } from '@/components/SortBar';
import { ApiError, fetchGlobalPosts } from '@/lib/api';
import { mapApiPost, updatePostVote } from '@/lib/mappers';
import { Post } from '@/types';

export function HomeView() {
  const { communities } = useAppContext();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPosts() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchGlobalPosts({ limit: 20 });
        if (cancelled) return;
        setPosts(data.map(mapApiPost));
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
  }, []);

  const handleVote = (postId: string, vote: 1 | -1 | 0) => {
    setPosts((prev) => updatePostVote(prev, postId, vote));
  };

  return (
    <div className="w-full">
      <CommunitiesStrip />
      <SortBar />

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
            Nothing here yet
          </h2>
          <p className="text-forest-muted">
            Be the first to post — or join a community to see its feed here.
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
