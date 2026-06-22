'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fadeIn, fadeUp } from '@/lib/motion';
import { useAppContext } from '@/context/AppContext';
import { CommunityPostActions } from '@/components/CommunityPostActions';
import { PostCard } from '@/components/PostCard';
import { SortBar } from '@/components/SortBar';
import { RemoteImage } from '@/components/RemoteImage';
import { ApiError, fetchCommunityPosts } from '@/lib/api';
import { getCommunityByName, mapApiPost, updatePostVote } from '@/lib/mappers';
import { Post } from '@/types';

export function CommunityView({ name }: { name: string }) {
  const { communities, communitiesLoading, toggleJoinCommunity, user } =
    useAppContext();
  const community = getCommunityByName(communities, name);

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPosts() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchCommunityPosts(name, { limit: 20 });
        if (cancelled) return;
        setPosts(data.map(mapApiPost));
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setError('not_found');
        } else {
          setError(
            err instanceof ApiError ? err.message : 'Could not load posts',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadPosts();
    return () => {
      cancelled = true;
    };
  }, [name]);

  const handleVote = (postId: string, vote: 1 | -1 | 0) => {
    setPosts((prev) => updatePostVote(prev, postId, vote));
  };

  if (!community && !communitiesLoading && communities.length > 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-forest-text">
          Community not found
        </h2>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="text-center py-20 text-forest-muted">
        Loading community…
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
                onJoin={() => toggleJoinCommunity(community.id)}
              />
            </div>
          </div>

          <p className="mt-4 text-forest-text/90 max-w-2xl">
            {community.description}
          </p>
        </div>
      </motion.div>

      <SortBar />

      {loading ? (
        <div className="text-center py-20 text-forest-muted">
          Gathering posts…
        </div>
      ) : error && error !== 'not_found' ? (
        <div className="text-center py-20 bg-forest-surface/80 border border-forest-border/40 rounded-2xl shadow-md shadow-black/10">
          <h2 className="font-display text-xl font-semibold text-forest-text mb-2">
            Could not load posts
          </h2>
          <p className="text-forest-muted">{error}</p>
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
          onJoin={() => toggleJoinCommunity(community.id)}
          compact
        />
      </div>
    </div>
  );
}
