'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { PostCard } from '@/components/PostCard';
import { CommentThread } from '@/components/CommentThread';
import { ApiError, fetchPost } from '@/lib/api';
import { fadeIn, fadeInDelayed } from '@/lib/motion';
import {
  getCommunityByName,
  mapApiPost,
  updatePostVote,
} from '@/lib/mappers';
import { Post } from '@/types';

export function PostDetailView({ name, id }: { name: string; id: string }) {
  const router = useRouter();
  const { communities, comments, user } = useAppContext();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const community = getCommunityByName(communities, name);
  const postComments = comments[id] || [];

  useEffect(() => {
    let cancelled = false;

    async function loadPost() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchPost(id);
        if (cancelled) return;
        setPost(mapApiPost(data));
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setError('not_found');
        } else {
          setError(
            err instanceof ApiError ? err.message : 'Could not load post',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadPost();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleVote = (vote: 1 | -1 | 0) => {
    setPost((prev) => {
      if (!prev) return prev;
      return updatePostVote([prev], prev.id, vote)[0];
    });
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-forest-muted">Loading post…</div>
    );
  }

  if (error === 'not_found' || !post || !community || post.communityId !== community.id) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-forest-text">Post not found</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-forest-text mb-2">
          Could not load post
        </h2>
        <p className="text-forest-muted">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full pb-20">
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-2 text-forest-muted hover:text-forest-text mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-medium">Back</span>
      </button>

      <motion.div
        key={post.id}
        className="mb-8"
        variants={fadeIn}
        initial="hidden"
        animate="visible"
      >
        <PostCard
          post={post}
          community={community}
          isDetail
          onVote={handleVote}
        />
      </motion.div>

      <motion.div
        key={`${post.id}-comments`}
        className="bg-forest-surface/90 border border-forest-border/50 rounded-2xl p-4 sm:p-6 shadow-md shadow-black/10"
        variants={fadeInDelayed}
        initial="hidden"
        animate="visible"
      >
        <h3 className="font-display text-lg font-semibold text-forest-text mb-6">
          Comments ({postComments.length > 0 ? postComments.length : post.commentCount})
        </h3>

        <div className="mb-8 rounded-xl border border-forest-border bg-forest-bg/50 p-4 text-sm text-forest-muted">
          {!user
            ? 'Log in to comment'
            : 'Commenting is disabled for now'}
        </div>

        {postComments.length === 0 ? (
          <div className="text-center py-10 text-forest-muted">
            No comments yet — be the first to share your thoughts.
          </div>
        ) : (
          <div className="space-y-6">
            {postComments.map((comment) => (
              <CommentThread
                key={comment.id}
                comment={comment}
                postId={post.id}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
