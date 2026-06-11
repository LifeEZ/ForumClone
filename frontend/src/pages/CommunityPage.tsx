import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import { PostCard } from '../components/PostCard';
import { SortBar } from '../components/SortBar';
import { SortOption } from '../types';
export const CommunityPage: React.FC = () => {
  const { handle } = useParams<{
    handle: string;
  }>();
  const { communities, posts, toggleJoinCommunity } = useAppContext();
  const [sort, setSort] = useState<SortOption>('Hot');
  const community = communities.find((c) => c.handle === handle);
  const communityPosts = useMemo(() => {
    if (!community) return [];
    let filtered = posts.filter((p) => p.communityId === community.id);
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
      filtered.sort((a, b) => {
        const scoreA = a.upvotes - a.downvotes;
        const scoreB = b.upvotes - b.downvotes;
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return scoreB + timeB / 10000000 - (scoreA + timeA / 10000000);
      });
    }
    return filtered;
  }, [posts, community, sort]);
  if (!community) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-forest-text">
          Community not found
        </h2>
      </div>);

  }
  return (
    <div className="w-full">
      {/* Community Header */}
      <div className="bg-forest-surface border border-forest-border rounded-2xl overflow-hidden mb-6 sm:mb-8">
        <div className="h-32 sm:h-48 w-full bg-forest-bg">
          <img
            src={community.bannerUrl}
            alt=""
            className="w-full h-full object-cover opacity-80" />
          
        </div>
        <div className="p-4 sm:p-6 relative">
          <div className="absolute -top-12 sm:-top-16 left-4 sm:left-6 p-1 bg-forest-surface rounded-full">
            <img
              src={community.avatarUrl}
              alt=""
              className="w-20 h-20 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-forest-surface" />
            
          </div>

          <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-forest-text">
                {community.name}
              </h1>
              <p className="text-forest-muted font-medium">
                r/{community.handle}
              </p>
            </div>

            <button
              onClick={() => toggleJoinCommunity(community.id)}
              className={`px-6 py-2 rounded-xl font-semibold transition-colors w-full sm:w-auto ${community.isJoined ? 'bg-forest-bg border border-forest-border text-forest-text hover:bg-forest-surface-hover' : 'bg-forest-accent text-white hover:bg-forest-accent-hover'}`}>
              
              {community.isJoined ? 'Joined' : 'Join'}
            </button>
          </div>

          <p className="mt-4 text-forest-text/90 max-w-2xl">
            {community.description}
          </p>
        </div>
      </div>

      <SortBar currentSort={sort} onSortChange={setSort} />

      {communityPosts.length === 0 ?
      <div className="text-center py-20 bg-forest-surface border border-forest-border rounded-2xl">
          <h2 className="text-xl font-bold text-forest-text mb-2">
            No posts yet
          </h2>
          <p className="text-forest-muted">
            Be the first to post in r/{community.handle}!
          </p>
        </div> :

      <div className="space-y-4 sm:space-y-6">
          {communityPosts.map((post, index) =>
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
            </motion.div>
        )}
        </div>
      }
    </div>);

};