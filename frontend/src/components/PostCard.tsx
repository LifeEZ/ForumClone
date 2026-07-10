'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageSquare, Share2, Bookmark } from 'lucide-react';
import { Post, Community } from '@/types';
import { VoteControl } from '@/components/VoteControl';
import { RemoteImage } from '@/components/RemoteImage';
import { RelativeTime } from '@/components/RelativeTime';
import { useAuth } from '@/context/AuthContext';
import { ApiError, castVote } from '@/lib/api';

interface PostCardProps {
  post: Post;
  community?: Community;
  isDetail?: boolean;
  /** Show community avatar + name in feed cards. Hide on community page. */
  showCommunity?: boolean;
  onVote?: (vote: 1 | -1 | 0) => void;
}

export function PostCard({
  post,
  community,
  isDetail = false,
  showCommunity = true,
  onVote,
}: PostCardProps) {
  const router = useRouter();
  const { user: authUser } = useAuth();

  // Local override used when no parent onVote is supplied (feed cards): the
  // card owns its optimistic vote state and calls the API itself.
  const [local, setLocal] = useState<{
    upvotes: number;
    downvotes: number;
    userVote: 1 | -1 | 0;
  } | null>(null);

  const display = local ?? {
    upvotes: post.upvotes,
    downvotes: post.downvotes,
    userVote: post.userVote,
  };

  const handleVote =
    onVote ??
    (async (vote: 1 | -1 | 0) => {
      if (!authUser) return;
      const prev = display;
      let newUpvotes = prev.upvotes;
      let newDownvotes = prev.downvotes;
      if (prev.userVote === 1) newUpvotes--;
      if (prev.userVote === -1) newDownvotes--;
      if (vote === 1) newUpvotes++;
      if (vote === -1) newDownvotes++;
      setLocal({ upvotes: newUpvotes, downvotes: newDownvotes, userVote: vote });
      try {
        await castVote({ target_type: 'post', target_id: post.id, value: vote });
      } catch (err) {
        setLocal({
          upvotes: prev.upvotes,
          downvotes: prev.downvotes,
          userVote: prev.userVote,
        });
        if (err instanceof ApiError && err.status === 401) {
          // token refresh failed; rolled back
        }
      }
    });

  const postHref =
    community != null ? `/c/${community.name}/posts/${post.id}` : `/`;

  const handleCardClick = (e: React.MouseEvent) => {
    if (
      (e.target as HTMLElement).closest('button') ||
      (e.target as HTMLElement).closest('a')
    ) {
      return;
    }
    if (!isDetail && community) {
      router.push(postHref);
    }
  };

  const Wrapper = isDetail ? 'div' : 'article';

  return (
    <Wrapper
      onClick={handleCardClick}
      className={`min-w-0 bg-forest-surface/90 border-forest-border rounded-2xl p-4 sm:p-5 ${
        !isDetail
          ? 'border border-forest-border/50 hover:border-forest-muted/25 hover:shadow-lg hover:shadow-black/10 transition-all cursor-pointer'
          : 'shadow-md shadow-black/10'
      }`}
    >
      <div className="flex items-center gap-2 mb-3 text-sm min-w-0 flex-wrap">
        {community && showCommunity && (
          <Link
            href={`/c/${community.name}`}
            className="flex items-center gap-2 shrink-0 group"
            onClick={(e) => !isDetail && e.stopPropagation()}
          >
            <RemoteImage
              src={community.avatarUrl}
              alt={community.displayName}
              width={32}
              height={32}
              className="w-8 h-8 shrink-0 rounded-full object-cover ring-2 ring-forest-border group-hover:ring-forest-accent/60 transition-all"
            />
            <span className="font-display text-sm font-semibold text-forest-text group-hover:text-forest-accent transition-colors">
              {community.displayName}
            </span>
          </Link>
        )}
        {community && showCommunity && (
          <span className="text-forest-muted">•</span>
        )}
        <span className="text-forest-muted">{post.author.username}</span>
        <span className="text-forest-muted">•</span>
        <span className="text-forest-muted">
          <RelativeTime date={post.createdAt} /> ago
        </span>
      </div>

      <div className="mb-4 min-w-0">
        <h2
          className={`${
            isDetail ? 'text-2xl font-bold mb-4' : 'text-lg font-semibold mb-2'
          } text-forest-text break-words`}
        >
          {post.title}
        </h2>
        {post.content && (
          <p
            className={`text-forest-text/90 whitespace-pre-wrap ${
              !isDetail ? 'line-clamp-3' : ''
            }`}
          >
            {post.content}
          </p>
        )}
        {post.imageUrl && (
          <div className="relative mt-4 rounded-xl overflow-hidden bg-forest-bg border border-forest-border aspect-video max-h-[500px]">
            <RemoteImage
              src={post.imageUrl}
              alt="Post content"
              fill
              sizes="(max-width: 768px) 100vw, 672px"
              className="object-cover"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <VoteControl
          upvotes={display.upvotes}
          downvotes={display.downvotes}
          userVote={display.userVote}
          onVote={handleVote}
          horizontal
        />

        <Link
          href={postHref}
          className="flex items-center gap-2 px-3 py-2 rounded-full text-forest-muted hover:bg-forest-surface-hover hover:text-forest-text transition-colors"
          onClick={(e) => isDetail && e.preventDefault()}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-sm font-medium">{post.commentCount}</span>
        </Link>

        <button
          type="button"
          className="flex items-center gap-2 px-3 py-2 rounded-full text-forest-muted hover:bg-forest-surface-hover hover:text-forest-text transition-colors ml-auto sm:ml-0"
        >
          <Share2 className="w-5 h-5" />
          <span className="text-sm font-medium hidden sm:inline">Share</span>
        </button>

        <button
          type="button"
          className="flex items-center gap-2 px-3 py-2 rounded-full text-forest-muted hover:bg-forest-surface-hover hover:text-forest-text transition-colors"
        >
          <Bookmark className="w-5 h-5" />
        </button>
      </div>
    </Wrapper>
  );
}
