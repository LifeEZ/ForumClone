'use client';

import { motion } from 'framer-motion';
import { useAppContext } from '@/context/AppContext';
import { PostCard } from '@/components/PostCard';
import { SortBar } from '@/components/SortBar';

export function HomeView() {
  const { posts, communities } = useAppContext();

  const joinedCommunityIds = new Set(
    communities.filter((c) => c.isJoined).map((c) => c.id),
  );

  const feedPosts = [...posts]
    .filter((p) => joinedCommunityIds.has(p.communityId))
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  return (
    <div className="w-full">
      <SortBar />

      {feedPosts.length === 0 ? (
        <div className="text-center py-20 bg-forest-surface border border-forest-border rounded-2xl">
          <h2 className="text-xl font-bold text-forest-text mb-2">
            Your feed is empty
          </h2>
          <p className="text-forest-muted">
            Join communities to personalize your home feed. Until then, browse
            communities from the sidebar.
          </p>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {feedPosts.map((post, index) => {
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
                <PostCard post={post} community={community} />
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
