import React from 'react';
import { ArrowBigUp, ArrowBigDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
interface VoteControlProps {
  upvotes: number;
  downvotes: number;
  userVote: 1 | -1 | 0;
  onVote: (vote: 1 | -1 | 0) => void;
  horizontal?: boolean;
}
export const VoteControl: React.FC<VoteControlProps> = ({
  upvotes,
  downvotes,
  userVote,
  onVote,
  horizontal = false
}) => {
  const score = upvotes - downvotes;
  const handleUpvote = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onVote(userVote === 1 ? 0 : 1);
  };
  const handleDownvote = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onVote(userVote === -1 ? 0 : -1);
  };
  return (
    <div
      className={`flex items-center gap-1 bg-forest-bg/50 rounded-full p-1 border border-forest-border ${horizontal ? 'flex-row' : 'flex-col sm:flex-row'}`}>
      
      <button
        onClick={handleUpvote}
        className={`p-1.5 rounded-full transition-colors ${userVote === 1 ? 'text-vote-up bg-vote-up/10' : 'text-forest-muted hover:bg-forest-surface-hover hover:text-vote-up'}`}
        aria-label="Upvote">
        
        <ArrowBigUp
          className="w-5 h-5"
          fill={userVote === 1 ? 'currentColor' : 'none'} />
        
      </button>

      <div className="relative w-8 h-6 flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={score}
            initial={{
              y: userVote === 1 ? 20 : -20,
              opacity: 0
            }}
            animate={{
              y: 0,
              opacity: 1
            }}
            exit={{
              y: userVote === 1 ? -20 : 20,
              opacity: 0
            }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 25
            }}
            className={`text-sm font-semibold ${userVote === 1 ? 'text-vote-up' : userVote === -1 ? 'text-vote-down' : 'text-forest-text'}`}>
            
            {score}
          </motion.span>
        </AnimatePresence>
      </div>

      <button
        onClick={handleDownvote}
        className={`p-1.5 rounded-full transition-colors ${userVote === -1 ? 'text-vote-down bg-vote-down/10' : 'text-forest-muted hover:bg-forest-surface-hover hover:text-vote-down'}`}
        aria-label="Downvote">
        
        <ArrowBigDown
          className="w-5 h-5"
          fill={userVote === -1 ? 'currentColor' : 'none'} />
        
      </button>
    </div>);

};