'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '@/context/AppContext';
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
      <SortBar />

      {loading ? (
        <div className="text-center py-20 text-forest-muted">Loading posts…</div>
      ) : error ? (
        <div className="text-center py-20 bg-forest-surface border border-forest-border rounded-2xl">
          <h2 className="text-xl font-bold text-forest-text mb-2">
            Could not load feed
          </h2>
          <p className="text-forest-muted">{error}</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 bg-forest-surface border border-forest-border rounded-2xl">
          <h2 className="text-xl font-bold text-forest-text mb-2">
            No posts yet
          </h2>
          <p className="text-forest-muted">
            Run the seed script on the backend to load demo content.
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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
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
