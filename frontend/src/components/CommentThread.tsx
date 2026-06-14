'use client';

import { useState } from 'react';
import { MessageSquare, MinusSquare, PlusSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Comment } from '@/types';
import { VoteControl } from '@/components/VoteControl';
import { UserAvatar } from '@/components/UserAvatar';
import { RelativeTime } from '@/components/RelativeTime';
import { useAppContext } from '@/context/AppContext';

const MAX_REPLY_DEPTH = 10;
const MAX_VISUAL_DEPTH = 4;

interface CommentThreadProps {
  comment: Comment;
  postId: string;
  depth?: number;
}

export function CommentThread({
  comment,
  postId,
  depth = 0,
}: CommentThreadProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const { voteComment, addComment } = useAppContext();

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    addComment(postId, comment.id, replyContent);
    setReplyContent('');
    setIsReplying(false);
  };

  const canReply = depth < MAX_REPLY_DEPTH;

  return (
    <div className={`relative ${depth > 0 ? 'mt-3' : 'mt-4'}`}>
      {depth > 0 && !isCollapsed && (
        <div
          className="absolute left-[-16px] sm:left-[-20px] top-8 bottom-0 w-px bg-forest-border hover:bg-forest-muted transition-colors cursor-pointer"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      <div
        className="flex gap-2 sm:gap-3"
        style={{
          marginLeft:
            depth > 0
              ? `${Math.min(depth, MAX_VISUAL_DEPTH) * 12}px`
              : undefined,
        }}
      >
        <div className="flex flex-col items-center">
          <UserAvatar
            userId={comment.author.id}
            username={comment.author.username}
            avatarUrl={comment.author.avatarUrl}
            className="w-6 h-6 sm:w-8 sm:h-8"
            size={32}
          />
          {isCollapsed ? (
            <button
              type="button"
              onClick={() => setIsCollapsed(false)}
              className="mt-2 text-forest-muted hover:text-forest-text"
            >
              <PlusSquare className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsCollapsed(true)}
              className="mt-2 text-forest-muted hover:text-forest-text opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MinusSquare className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex-1 min-w-0 group">
          <div className="flex items-center gap-2 text-xs sm:text-sm mb-1">
            <span className="font-semibold text-forest-text">
              {comment.author.username}
            </span>
            {comment.author.karma != null && (
              <>
                <span className="text-forest-muted">•</span>
                <span className="text-forest-muted">
                  {comment.author.karma} karma
                </span>
              </>
            )}
            <span className="text-forest-muted">•</span>
            <span className="text-forest-muted">
              <RelativeTime date={comment.createdAt} /> ago
            </span>
          </div>

          {!isCollapsed && (
            <>
              <p className="text-sm sm:text-base text-forest-text/90 whitespace-pre-wrap mb-2">
                {comment.content}
              </p>

              <div className="flex items-center gap-4 mb-2">
                <VoteControl
                  upvotes={comment.upvotes}
                  downvotes={comment.downvotes}
                  userVote={comment.userVote}
                  onVote={(vote) => voteComment(postId, comment.id, vote)}
                  horizontal
                />
                {canReply && (
                  <button
                    type="button"
                    onClick={() => setIsReplying(!isReplying)}
                    className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-forest-muted hover:text-forest-text transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Reply
                  </button>
                )}
              </div>

              <AnimatePresence>
                {isReplying && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mb-4"
                  >
                    <form
                      onSubmit={handleReplySubmit}
                      className="flex flex-col gap-2 mt-2"
                    >
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="What are your thoughts?"
                        className="w-full bg-forest-bg border border-forest-border rounded-xl p-3 text-sm text-forest-text placeholder:text-forest-muted focus:outline-none focus:border-forest-accent focus:ring-1 focus:ring-forest-accent resize-none min-h-[80px]"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsReplying(false)}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium text-forest-muted hover:bg-forest-surface transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={!replyContent.trim()}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-forest-accent text-white hover:bg-forest-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Reply
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </div>

      {!isCollapsed && comment.replies && comment.replies.length > 0 && (
        <div>
          {comment.replies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              postId={postId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
