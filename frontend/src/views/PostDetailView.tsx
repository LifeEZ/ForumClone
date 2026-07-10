'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PostCard } from '@/components/PostCard';
import { CommentThread } from '@/components/CommentThread';
import { ApiError, castVote, createComment, fetchComments, fetchCommunity, fetchPost } from '@/lib/api';
import { fadeIn, fadeInDelayed } from '@/lib/motion';
import {
  mapApiComment,
  mapApiCommunity,
  mapApiPost,
  mapAuthUser,
  updateCommentVote,
  updatePostVote,
} from '@/lib/mappers';
import { Community, Comment, Post } from '@/types';

export function PostDetailView({ name, id }: { name: string; id: string }) {
  const router = useRouter();
  const { user: authUser, isLoading: authLoading } = useAuth();
  const user = authUser ? mapAuthUser(authUser) : null;

  const [community, setCommunity] = useState<Community | null>(null);
  const [communityLoading, setCommunityLoading] = useState(true);
  const [post, setPost] = useState<Post | null>(null);
  const [postLoading, setPostLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentContent, setCommentContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    const controller = new AbortController();

    async function loadCommunity() {
      setCommunityLoading(true);
      try {
        const data = await fetchCommunity(name, { authenticated: !!authUser, signal: controller.signal });
        if (controller.signal.aborted) return;
        setCommunity(mapApiCommunity(data));
      } catch (err) {
        if (controller.signal.aborted) return;
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (err instanceof ApiError && err.status === 404) {
          setCommunity(null);
        }
      } finally {
        if (!controller.signal.aborted) setCommunityLoading(false);
      }
    }

    void loadCommunity();
    return () => {
      controller.abort();
    };
  }, [name, authUser, authLoading]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPost() {
      setPostLoading(true);
      setError(null);
      try {
        const data = await fetchPost(id, controller.signal);
        if (controller.signal.aborted) return;
        setPost(mapApiPost(data));
      } catch (err) {
        if (controller.signal.aborted) return;
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (err instanceof ApiError && err.status === 404) {
          setError('not_found');
        } else {
          setError(
            err instanceof ApiError ? err.message : 'Could not load post',
          );
        }
      } finally {
        if (!controller.signal.aborted) setPostLoading(false);
      }
    }

    void loadPost();
    return () => {
      controller.abort();
    };
  }, [id]);

  useEffect(() => {
    const controller = new AbortController();

    async function run() {
      setCommentsLoading(true);
      setCommentError(null);
      try {
        const data = await fetchComments(id, controller.signal);
        if (controller.signal.aborted) return;
        setComments(data.map(mapApiComment));
      } catch (err) {
        if (controller.signal.aborted) return;
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setCommentError(
          err instanceof ApiError ? err.message : 'Could not load comments',
        );
      } finally {
        if (!controller.signal.aborted) setCommentsLoading(false);
      }
    }

    void run();
    return () => {
      controller.abort();
    };
  }, [id]);

  const handleVote = async (vote: 1 | -1 | 0) => {
    if (!post || !authUser) return;
    const prev = post;
    setPost(updatePostVote([prev], prev.id, vote)[0]);
    try {
      await castVote({ target_type: 'post', target_id: prev.id, value: vote });
    } catch (err) {
      setPost(prev);
      if (err instanceof ApiError && err.status === 401) {
        // token refresh failed; leave rolled-back state
      }
    }
  };

  const insertReply = (
    list: Comment[],
    parentId: string,
    newReply: Comment,
  ): Comment[] => {
    return list.map((c) => {
      if (c.id === parentId) {
        return { ...c, replies: [...(c.replies ?? []), newReply] };
      }
      if (c.replies && c.replies.length > 0) {
        return { ...c, replies: insertReply(c.replies, parentId, newReply) };
      }
      return c;
    });
  };

  const handleReply = async (parentId: string, content: string) => {
    setCommentError(null);
    try {
      const created = await createComment(id, {
        content,
        parent_id: parentId,
      });
      setComments((prev) => insertReply(prev, parentId, mapApiComment(created)));
      setPost((prev) =>
        prev ? { ...prev, commentCount: prev.commentCount + 1 } : prev,
      );
    } catch (err) {
      setCommentError(
        err instanceof ApiError ? err.message : 'Could not post reply',
      );
    }
  };

  const handleTopLevelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;
    setSubmitting(true);
    setCommentError(null);
    try {
      const created = await createComment(id, { content: commentContent });
      const mapped = mapApiComment(created);
      // Top-level is newest-first
      setComments((prev) => [mapped, ...prev]);
      setPost((prev) =>
        prev ? { ...prev, commentCount: prev.commentCount + 1 } : prev,
      );
      setCommentContent('');
    } catch (err) {
      setCommentError(
        err instanceof ApiError ? err.message : 'Could not post comment',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCommentVote = async (commentId: string, vote: 1 | -1 | 0) => {
    if (!authUser) return;
    const prev = comments;
    setComments(updateCommentVote(prev, commentId, vote));
    try {
      await castVote({ target_type: 'comment', target_id: commentId, value: vote });
    } catch (err) {
      setComments(prev);
      if (err instanceof ApiError && err.status === 401) {
        // token refresh failed; leave rolled-back state
      }
    }
  };

  const loading = communityLoading || postLoading;

  if (loading) {
    return (
      <div className="text-center py-20 text-forest-muted">Loading post…</div>
    );
  }

  if (
    error === 'not_found' ||
    !post ||
    !community ||
    post.communityId !== community.id
  ) {
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

  const headerCount = commentsLoading ? post.commentCount : comments.length;

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
        <PostCard post={post} community={community} isDetail onVote={handleVote} />
      </motion.div>

      <motion.div
        key={`${post.id}-comments`}
        className="bg-forest-surface/90 border border-forest-border/50 rounded-2xl p-4 sm:p-6 shadow-md shadow-black/10"
        variants={fadeInDelayed}
        initial="hidden"
        animate="visible"
      >
        <h3 className="font-display text-lg font-semibold text-forest-text mb-6">
          Comments ({headerCount})
        </h3>

        {user ? (
          <form
            onSubmit={handleTopLevelSubmit}
            className="mb-8 flex flex-col gap-2"
          >
            <textarea
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder="What are your thoughts?"
              className="w-full bg-forest-bg border border-forest-border rounded-xl p-3 text-sm text-forest-text placeholder:text-forest-muted focus:outline-none focus:border-forest-accent focus:ring-1 focus:ring-forest-accent resize-none min-h-[80px]"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!commentContent.trim() || submitting}
                className="px-4 py-1.5 rounded-lg text-sm font-medium bg-forest-accent text-white hover:bg-forest-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Posting…' : 'Comment'}
              </button>
            </div>
          </form>
        ) : (
          <div className="mb-8 rounded-xl border border-forest-border bg-forest-bg/50 p-4 text-sm text-forest-muted">
            Log in to comment
          </div>
        )}

        {commentError && (
          <div className="mb-6 rounded-xl border border-forest-border bg-forest-bg/50 p-3 text-sm text-red-400">
            {commentError}
          </div>
        )}

        {commentsLoading ? (
          <div className="text-center py-10 text-forest-muted">
            Loading comments…
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-10 text-forest-muted">
            No comments yet — be the first to share your thoughts.
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map((comment) => (
              <CommentThread
                key={comment.id}
                comment={comment}
                postId={post.id}
                onReply={handleReply}
                onVote={handleCommentVote}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
