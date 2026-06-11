import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import { PostCard } from '../components/PostCard';
import { SortBar } from '../components/SortBar';
import { SortOption } from '../types';
export const Home: React.FC = () => {
  const { posts, communities } = useAppContext();
  const [sort, setSort] = useState<SortOption>('Hot');
  // Filter posts to only joined communities
  const joinedCommunityIds = new Set(
    communities.filter((c) => c.isJoined).map((c) => c.id)
  );
  const feedPosts = useMemo(() => {
    let filtered = posts.filter((p) => joinedCommunityIds.has(p.communityId));
    // Sort logic
    if (sort === 'New') {
      filtered.sort(
        (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (sort === 'Top') {
      filtered.sort(
        (a, b) => b.upvotes - b.downvotes - (a.upvotes - a.downvotes)
      );
    } else {
      // Hot: simple mock logic (score + recency)
      filtered.sort((a, b) => {
        const scoreA = a.upvotes - a.downvotes;
        const scoreB = b.upvotes - b.downvotes;
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return scoreB + timeB / 10000000 - (scoreA + timeA / 10000000);
      });
    }
    return filtered;
  }, [posts, joinedCommunityIds, sort]);
  return (
    <div className="w-full">
      <SortBar currentSort={sort} onSortChange={setSort} />

      {feedPosts.length === 0 ?
      <div className="text-center py-20 bg-forest-surface border border-forest-border rounded-2xl">
          <h2 className="text-xl font-bold text-forest-text mb-2">
            Your feed is empty
          </h2>
          <p className="text-forest-muted">
            Join some communities to see posts here.
          </p>
        </div> :

      <div className="space-y-4 sm:space-y-6">
          {feedPosts.map((post, index) => {
          const community = communities.find((c) => c.id === post.communityId);
          return (
            <motion.div
              key={post.id}
              initial={{
                opacity: 0,
                y: 20
              }}
              animate={{
                opacity: 1,
                y: 0
              }}
              transition={{
                duration: 0.3,
                delay: index * 0.05
              }}>
              
                <PostCard post={post} community={community} />
              </motion.div>);

        })}
        </div>
      }
    </div>);

};