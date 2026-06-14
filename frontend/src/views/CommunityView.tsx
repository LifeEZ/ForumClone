'use client';

import { motion } from 'framer-motion';
import { useAppContext } from '@/context/AppContext';
import { PostCard } from '@/components/PostCard';
import { SortBar } from '@/components/SortBar';
import { RemoteImage } from '@/components/RemoteImage';
import { getCommunityByName } from '@/data/mockData';

export function CommunityView({ name }: { name: string }) {
  const { communities, posts, toggleJoinCommunity } = useAppContext();
  const community = getCommunityByName(communities, name);

  const communityPosts = community
    ? [...posts]
        .filter((p) => p.communityId === community.id)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
    : [];

  if (!community) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-forest-text">
          Community not found
        </h2>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="bg-forest-surface border border-forest-border rounded-2xl overflow-hidden mb-6 sm:mb-8">
        <div className="relative h-32 sm:h-48 w-full bg-forest-bg">
          <RemoteImage
            src={community.bannerUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 672px"
            className="object-cover opacity-80"
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
              <h1 className="text-2xl sm:text-3xl font-bold text-forest-text">
                {community.displayName}
              </h1>
              <p className="text-forest-muted font-medium">
                c/{community.name}
              </p>
            </div>

            <button
              type="button"
              onClick={() => toggleJoinCommunity(community.id)}
              className={`px-6 py-2 rounded-xl font-semibold transition-colors w-full sm:w-auto ${
                community.isJoined
                  ? 'bg-forest-bg border border-forest-border text-forest-text hover:bg-forest-surface-hover'
                  : 'bg-forest-accent text-white hover:bg-forest-accent-hover'
              }`}
            >
              {community.isJoined ? 'Joined' : 'Join'}
            </button>
          </div>

          <p className="mt-4 text-forest-text/90 max-w-2xl">
            {community.description}
          </p>
        </div>
      </div>

      <SortBar />

      {communityPosts.length === 0 ? (
        <div className="text-center py-20 bg-forest-surface border border-forest-border rounded-2xl">
          <h2 className="text-xl font-bold text-forest-text mb-2">
            No posts yet
          </h2>
          <p className="text-forest-muted">
            Be the first to post in c/{community.name}!
          </p>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {communityPosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <PostCard post={post} community={community} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
