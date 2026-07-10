'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { MessageSquare, PlusSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Comment } from '@/types';
import { VoteControl } from '@/components/VoteControl';
import { UserAvatar } from '@/components/UserAvatar';
import { RelativeTime } from '@/components/RelativeTime';
import { useAuth } from '@/context/AuthContext';

const MAX_REPLY_DEPTH = 10;
const MAX_VISUAL_DEPTH = 6;

const GUTTER = 'pl-6 sm:pl-7';
// Curve radius / horizontal distance from rail (avatar center) to child avatar.
const CURVE_R = 12;
// Thread colors. Both rail (bg) and elbow (stroke via currentColor) flip to the
// accent when any part of the thread is hovered.
const RAIL_BASE = 'bg-forest-muted/40';
const RAIL_HOVER = 'bg-forest-accent';
const ELBOW_BASE = 'text-forest-muted/40';
const ELBOW_HOVER = 'text-forest-accent';

interface CommentThreadProps {
  comment: Comment;
  postId: string;
  depth?: number;
  onReply?: (parentId: string, content: string) => void;
  onVote?: (commentId: string, vote: 1 | -1 | 0) => void;
}

export function CommentThread({
  comment,
  postId,
  depth = 0,
  onReply,
  onVote,
}: CommentThreadProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const { user } = useAuth();
  const isLoggedIn = !!user;

  const rootRef = useRef<HTMLDivElement>(null);
  // One ref per child elbow, to measure each connector's start position.
  const elbowRefs = useRef<(HTMLButtonElement | null)[]>([]);
  // Rail is split into segments that stop where each elbow begins and resume
  // below that elbow's descent, so the line never overlaps the curves.
  const [measuredSegments, setMeasuredSegments] = useState<
    { top: number; height: number }[]
  >([]);
  const segments =
    !hasReplies || isCollapsed || !drawLine ? [] : measuredSegments;
  // Hovering any rail segment or elbow highlights the whole thread together.
  const [threadHovered, setThreadHovered] = useState(false);

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    onReply?.(comment.id, replyContent);
    setReplyContent('');
    setIsReplying(false);
  };

  const canReply = depth < MAX_REPLY_DEPTH && isLoggedIn;
  const canShowReply = depth < MAX_REPLY_DEPTH;
  const hasReplies = !!comment.replies && comment.replies.length > 0;
  const drawLine = depth < MAX_VISUAL_DEPTH;

  useLayoutEffect(() => {
    if (!hasReplies || isCollapsed || !drawLine) {
      return;
    }
    const measure = () => {
      const root = rootRef.current;
      if (!root) return;
      const railTop = window.innerWidth >= 640 ? 32 : 24; // avatar bottom
      const rootTop = root.getBoundingClientRect().top;
      const starts = elbowRefs.current
        .filter((el): el is HTMLButtonElement => !!el)
        .map((el) => el.getBoundingClientRect().top - rootTop);
      if (starts.length === 0) {
        setMeasuredSegments([]);
        return;
      }
      const segs: { top: number; height: number }[] = [];
      // Segment from this avatar's bottom down to the first elbow.
      if (starts[0] > railTop) segs.push({ top: railTop, height: starts[0] - railTop });
      // Segments between elbows: resume below the previous elbow's descent
      // (starts[i-1] + CURVE_R ≈ previous child's avatar center) and stop at
      // the next elbow's start. No segment after the last elbow.
      for (let i = 1; i < starts.length; i++) {
        const segTop = starts[i - 1] + CURVE_R;
        if (starts[i] > segTop) segs.push({ top: segTop, height: starts[i] - segTop });
      }
      setMeasuredSegments(segs);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (rootRef.current) ro.observe(rootRef.current);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [hasReplies, isCollapsed, drawLine, comment.replies]);

  const hoverProps = {
    onMouseEnter: () => setThreadHovered(true),
    onMouseLeave: () => setThreadHovered(false),
  };

  return (
    <div ref={rootRef} className={`relative ${depth > 0 ? 'mt-3' : 'mt-4'}`}>
      {/* Rail segments: each runs from the previous anchor (this avatar's
          bottom for the first, the previous child's avatar center thereafter)
          down to the next elbow's start. Click any segment to collapse. */}
      {!isCollapsed && hasReplies && drawLine &&
        segments.map((s, i) => (
          <button
            key={i}
            type="button"
            aria-label="Collapse thread"
            onClick={() => setIsCollapsed(true)}
            {...hoverProps}
            className="absolute left-3 sm:left-4 -ml-1 w-3 cursor-pointer"
            style={{ top: s.top, height: s.height }}
          >
            <span
              className={`absolute left-1 top-0 bottom-0 w-0.5 rounded-full transition-colors ${
                threadHovered ? RAIL_HOVER : RAIL_BASE
              }`}
            />
          </button>
        ))}

      <div className="flex gap-2 sm:gap-3">
        <div className="flex flex-col items-center shrink-0">
          <UserAvatar
            userId={comment.author.id}
            username={comment.author.username}
            avatarUrl={comment.author.avatarUrl}
            className="w-6 h-6 sm:w-8 sm:h-8"
            size={32}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs sm:text-sm mb-1">
            <span className="font-semibold text-forest-text">
              {comment.author.username}
            </span>
            <span className="text-forest-muted">•</span>
            <span className="text-forest-muted">
              <RelativeTime date={comment.createdAt} /> ago
            </span>
          </div>

          <p className="text-sm sm:text-base text-forest-text/90 whitespace-pre-wrap mb-2">
            {comment.content}
          </p>

          <div className="flex items-center gap-4 mb-2">
            <VoteControl
              upvotes={comment.upvotes}
              downvotes={comment.downvotes}
              userVote={comment.userVote}
              onVote={(vote) => onVote?.(comment.id, vote)}
              horizontal
            />
            {canShowReply &&
              (canReply ? (
                <button
                  type="button"
                  onClick={() => setIsReplying(!isReplying)}
                  className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-forest-muted hover:text-forest-text transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  Reply
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  title="Log in to reply"
                  className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-forest-muted/50 cursor-not-allowed"
                >
                  <MessageSquare className="w-4 h-4" />
                  Reply
                </button>
              ))}
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

          {isCollapsed && hasReplies && (
            <button
              type="button"
              onClick={() => setIsCollapsed(false)}
              className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-forest-muted hover:text-forest-text transition-colors mb-2"
            >
              <PlusSquare className="w-4 h-4" />
              {comment.replies!.length}{' '}
              {comment.replies!.length === 1 ? 'reply' : 'replies'}
            </button>
          )}
        </div>
      </div>


      {!isCollapsed && hasReplies && (
        <div className={`${drawLine ? GUTTER : ''}`}>
          {comment.replies!.map((reply, i) => {
            return (
              <div key={reply.id} className="relative">
                {/* Elbow: a soft curve descending from the rail and sweeping
                    right toward the child avatar. Click to collapse the thread.
                    The ref marks this elbow's start so the rail can stop here. */}
                {drawLine && (
                  <button
                    type="button"
                    aria-label="Collapse thread"
                    onClick={() => setIsCollapsed(true)}
                    {...hoverProps}
                    ref={(el) => {
                      elbowRefs.current[i] = el;
                    }}
                    className={`absolute right-full top-0 sm:top-1 -mt-px w-3 h-3 cursor-pointer transition-colors ${
                      threadHovered ? ELBOW_HOVER : ELBOW_BASE
                    }`}
                  >
                    <svg
                      width={CURVE_R}
                      height={CURVE_R}
                      viewBox={`0 0 ${CURVE_R} ${CURVE_R}`}
                      fill="none"
                      className="block overflow-visible"
                    >
                      <path
                        d={`M1 1 C 1 ${CURVE_R - 1} 3 ${CURVE_R} ${CURVE_R - 1} ${CURVE_R}`}
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                )}
                <CommentThread
                  comment={reply}
                  postId={postId}
                  depth={depth + 1}
                  onReply={onReply}
                  onVote={onVote}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
