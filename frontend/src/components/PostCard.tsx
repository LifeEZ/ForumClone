import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Share2, Bookmark } from 'lucide-react';
import { Post, Community } from '../types';
import { VoteControl } from './VoteControl';
import { useAppContext } from '../context/AppContext';
interface PostCardProps {
  post: Post;
  community?: Community;
  isDetail?: boolean;
}
export const PostCard: React.FC<PostCardProps> = ({
  post,
  community,
  isDetail = false
}) => {
  const navigate = useNavigate();
  const { votePost } = useAppContext();
  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent navigation if clicking interactive elements
    if (
    (e.target as HTMLElement).closest('button') ||
    (e.target as HTMLElement).closest('a'))
    {
      return;
    }
    if (!isDetail) {
      navigate(`/post/${post.id}`);
    }
  };
  const Wrapper = isDetail ? 'div' : 'article';
  return (
    <Wrapper
      onClick={handleCardClick}
      className={`bg-forest-surface border-forest-border rounded-2xl p-4 sm:p-5 ${!isDetail ? 'border hover:border-forest-muted/30 transition-colors cursor-pointer' : ''}`}>
      
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 text-sm">
        {community &&
        <Link
          to={`/r/${community.handle}`}
          className="flex items-center gap-2 group">
          
            <img
            src={community.avatarUrl}
            alt={community.name}
            className="w-6 h-6 rounded-full object-cover" />
          
            <span className="font-semibold text-forest-text group-hover:underline">
              r/{community.handle}
            </span>
          </Link>
        }
        <span className="text-forest-muted">•</span>
        <span className="text-forest-muted">
          Posted by u/{post.author.username}
        </span>
        <span className="text-forest-muted">•</span>
        <span className="text-forest-muted">
          {formatDistanceToNow(new Date(post.createdAt))} ago
        </span>
      </div>

      {/* Content */}
      <div className="mb-4">
        <h2
          className={`${isDetail ? 'text-2xl font-bold mb-4' : 'text-lg font-semibold mb-2'} text-forest-text`}>
          
          {post.title}
        </h2>
        {post.content &&
        <p
          className={`text-forest-text/90 whitespace-pre-wrap ${!isDetail ? 'line-clamp-3' : ''}`}>
          
            {post.content}
          </p>
        }
        {post.imageUrl &&
        <div className="mt-4 rounded-xl overflow-hidden bg-forest-bg border border-forest-border">
            <img
            src={post.imageUrl}
            alt="Post content"
            className="w-full h-auto max-h-[500px] object-cover" />
          
          </div>
        }
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 sm:gap-4">
        <VoteControl
          upvotes={post.upvotes}
          downvotes={post.downvotes}
          userVote={post.userVote}
          onVote={(vote) => votePost(post.id, vote)}
          horizontal />
        

        <Link
          to={`/post/${post.id}`}
          className="flex items-center gap-2 px-3 py-2 rounded-full text-forest-muted hover:bg-forest-surface-hover hover:text-forest-text transition-colors"
          onClick={(e) => isDetail && e.preventDefault()}>
          
          <MessageSquare className="w-5 h-5" />
          <span className="text-sm font-medium">{post.commentCount}</span>
        </Link>

        <button className="flex items-center gap-2 px-3 py-2 rounded-full text-forest-muted hover:bg-forest-surface-hover hover:text-forest-text transition-colors ml-auto sm:ml-0">
          <Share2 className="w-5 h-5" />
          <span className="text-sm font-medium hidden sm:inline">Share</span>
        </button>

        <button className="flex items-center gap-2 px-3 py-2 rounded-full text-forest-muted hover:bg-forest-surface-hover hover:text-forest-text transition-colors">
          <Bookmark className="w-5 h-5" />
        </button>
      </div>
    </Wrapper>);

};