import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { PostCard } from '../components/PostCard';
import { CommentThread } from '../components/CommentThread';
export const PostDetail: React.FC = () => {
  const { id } = useParams<{
    id: string;
  }>();
  const navigate = useNavigate();
  const { posts, communities, comments, addComment } = useAppContext();
  const [newComment, setNewComment] = useState('');
  const post = posts.find((p) => p.id === id);
  const community = post ?
  communities.find((c) => c.id === post.communityId) :
  undefined;
  const postComments = id ? comments[id] || [] : [];
  if (!post) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-forest-text">Post not found</h2>
      </div>);

  }
  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    addComment(post.id, null, newComment);
    setNewComment('');
  };
  return (
    <div className="w-full pb-20">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-forest-muted hover:text-forest-text mb-6 transition-colors">
        
        <ArrowLeft className="w-5 h-5" />
        <span className="font-medium">Back</span>
      </button>

      <div className="mb-8">
        <PostCard post={post} community={community} isDetail />
      </div>

      <div className="bg-forest-surface border border-forest-border rounded-2xl p-4 sm:p-6">
        <h3 className="text-lg font-bold text-forest-text mb-6">
          Comments ({post.commentCount})
        </h3>

        {/* Top level composer */}
        <form onSubmit={handleCommentSubmit} className="mb-8">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="w-full bg-forest-bg border border-forest-border rounded-xl p-4 text-forest-text placeholder:text-forest-muted focus:outline-none focus:border-forest-accent focus:ring-1 focus:ring-forest-accent resize-none min-h-[100px]" />
          
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="px-6 py-2 rounded-xl font-semibold bg-forest-accent text-white hover:bg-forest-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              
              Comment
            </button>
          </div>
        </form>

        {/* Comments Tree */}
        {postComments.length === 0 ?
        <div className="text-center py-10 text-forest-muted">
            No comments yet. Be the first to share your thoughts!
          </div> :

        <div className="space-y-6">
            {postComments.map((comment) =>
          <CommentThread
            key={comment.id}
            comment={comment}
            postId={post.id} />

          )}
          </div>
        }
      </div>
    </div>);

};